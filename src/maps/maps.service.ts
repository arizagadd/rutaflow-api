import { Client, DirectionsResponse, LatLng, TravelMode } from '@googlemaps/google-maps-services-js';
import { geocode } from '@googlemaps/google-maps-services-js/dist/geocode/geocode';
import { Injectable } from '@nestjs/common';
import { FilteredDirectionsData, SetupRouteDirectionsParams } from '../route/types/route.type';
import { DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { DirectionsRequestParams } from './maps.type';

@Injectable()
export class MapsService {
    private googleMapsClient: Client;
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.googleMapsClient = new Client({});
    }

    async getDirections(data: DirectionsRequestParams): Promise<DirectionsResponse> {
        try {
            const origin = await this.convertLocationToLatLng(data.origin);
            const destination = await this.convertLocationToLatLng(data.destination);
            let waypoints: LatLng[];
            let response: DirectionsResponse;

            if (!data.waypoints) {
                // send request to google with only origin and destination
                response = await this.googleMapsClient.directions({
                    // optimize field unnecessary when dealing with 2 points on a map
                    params: {
                        origin,
                        destination,
                        mode: TravelMode.driving,
                        key: this.apiKey,
                    },
                });
            } else {
                // send request with intermediary waypoints
                waypoints = await this.convertLocationsToLatLng(data.waypoints);
                response = await this.googleMapsClient.directions({
                    params: {
                        origin,
                        destination,
                        mode: TravelMode.driving,
                        waypoints,
                        optimize: true,
                        key: this.apiKey,
                    },
                });
            }

            return response;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            if (error.response && error.response.data && error.response.data.error_message) {
                throw new UnexpectedError({
                    domain: 'MAP',
                    layer: 'SERVICE',
                    type: 'UNEXPECTED_ERROR',
                    message: `Google Maps API error: ${error.response.data.error_message} `,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'MAP',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async convertLocationToLatLng(location: string): Promise<LatLng> {
        const params = {
            address: location,
            key: this.apiKey,
        };

        const response = await geocode({ params });

        if (response && response.data && response.data.results && response.data.results.length > 0) {
            return {
                latitude: response.data.results[0].geometry.location.lat,
                longitude: response.data.results[0].geometry.location.lng,
            };
        } else {
            throw new DomainError({
                domain: 'MAP',
                layer: 'SERVICE',
                message: `Cannot convert location "${location}" to latitude and longitude.`,
            });
        }
    }

    isLatLngFormat(location: string): boolean {
        const latLngRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
        return latLngRegex.test(location);
    }

    async convertLocationsToLatLng(locations: string[]): Promise<LatLng[]> {
        const convertedLocations: Promise<LatLng>[] = locations.map(async (location) => {
            if (this.isLatLngFormat(location)) {
                const [latStr, lngStr] = location.split(',').map((str) => str.trim());
                return {
                    latitude: parseFloat(latStr),
                    longitude: parseFloat(lngStr),
                };
            } else {
                return this.convertLocationToLatLng(location);
            }
        });

        return Promise.all(convertedLocations);
    }

    // Extract only the necessary fields from google maps API
    filterDirectionsResponse(directions: DirectionsResponse): FilteredDirectionsData {
        // get complete route polyline
        const polyline = directions.data.routes[0].overview_polyline.points;

        // legs represent each stop (waypoint) within the route
        const legs = directions.data.routes[0].legs;

        // calculate total distance and duration by summing up each leg's value
        let totalDistance = 0; // in meters
        let totalDuration = 0; // in seconds
        for (const leg of legs) {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
        }

        // get polyline for each waypoint,
        // index 0 is from origin to first stop
        // index 1 is from first stop to second stop, and so on
        const legPolyline: string[] = legs.map((leg) => {
            // Concatenate all the step polylines for this leg to get the entire leg's polyline
            return leg.steps.map((step) => step.polyline.points).join('');
        });

        const totalStops = legPolyline.length; // we don't take into account point of origin and we also remove index 0 from counter

        // totalDistance: `${totalDistance / 1000} km`, // convert meters to kilometers
        // totalDuration: `${totalDuration / 3600} hours`, // convert seconds to hours
        // stopInitial: legPolyline[0],
        // stopFinal: legPolyline[legPolyline.length - 1],

        const filteredData: FilteredDirectionsData = {
            polyline,
            legPolyline,
            legs,
            totalDistance,
            totalDuration,
            totalStops,
        };
        return filteredData;
    }

    setUpRouteDirectionsParams(params: SetupRouteDirectionsParams): DirectionsRequestParams {
        try {
            const origin = `${params.stopInitial.lat}, ${params.stopInitial.lon}`;
            const destination = `${params.stopFinal.lat}, ${params.stopFinal.lon}`;
            const coordinatesSet = new Set<string>(); // Using Set to ensure uniqueness
            let requestData: DirectionsRequestParams;

            if (!params.stopWaypoints) {
                // user only wants directions towards one location
                requestData = {
                    origin,
                    destination,
                };
            } else {
                params.stopWaypoints.forEach((stop) => {
                    const { lat, lon } = stop;

                    // Checking if the coordinates are neither for stop_initial nor for stop_final
                    if (
                        !(
                            (lat === params.stopInitial?.lat && lon === params.stopInitial?.lon) ||
                            (lat === params.stopFinal?.lat && lon === params.stopFinal?.lon)
                        )
                    ) {
                        coordinatesSet.add(`${lat}, ${lon}`);
                    }
                });

                requestData = {
                    origin,
                    destination,
                    waypoints: Array.from(coordinatesSet), // Converting Set back to Array
                };
            }

            return requestData;
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }
}
