import { Client, DirectionsResponse, LatLng, TravelMode } from '@googlemaps/google-maps-services-js';
import { geocode } from '@googlemaps/google-maps-services-js/dist/geocode/geocode';
import { Injectable } from '@nestjs/common';
import { FilteredDirectionsData, SetupRouteDirectionsParams } from '../route/types/route.type';
import { DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { DirectionsRequestParams } from './maps.type';
import axios from 'axios';
import { exit } from 'process';
import polyline from '@mapbox/polyline';

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
                        mode: TravelMode.drive,
                        key: this.apiKey,
                    },
                });
            } else {
                // send request with intermediary waypoints
                waypoints = await this.convertLocationsToLatLng(data.waypoints);

                if (waypoints.length > 23) {
                    console.log("Using Routes Preferred API for more than 23 waypoints");
                    // Use Routes Preferred API for more than 23 waypoints
                    return await this.getOptimizedDirectionsViaRoutesPreferred(data);
                }
                console.log("Using Google Maps API for less than 23 waypoints");
                response = await this.googleMapsClient.directions({
                    params: {
                        origin,
                        destination,
                        mode: TravelMode.drive,
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

    async getOptimizedDirectionsViaRoutesPreferred(data: DirectionsRequestParams): Promise<any> {
        const origin = await this.convertLocationToLatLng(data.origin);
        const destination = await this.convertLocationToLatLng(data.destination);
        const waypoints = await this.convertLocationsToLatLng(data.waypoints);

        let allDecodedPoints: [number, number][] = [];
        const CHUNK_SIZE = 25;
        const waypointChunks = this.chunkWaypoints(waypoints, CHUNK_SIZE);

        let currentOrigin = origin;
        let fullRoute: any = {
            data: {
                routes: [
                    {
                        legs: [],
                        polyline: { encodedPolyline: '' },
                        distanceMeters: 0,
                        duration:  0 ,
                        totalStops: 0,
                    }
                ],
            },
        };
        
        for (let i = 0; i < waypointChunks.length; i++) {
            const chunk = waypointChunks[i];
            const nextDestination = 
                i === waypointChunks.length - 1 && destination
                    ? destination
                    : chunk[chunk.length - 1];
    
            const chunkWaypoints = chunk.slice(0);
    
            const intermediates = chunkWaypoints.map((wp) => ({
                location: { latLng: wp },
            }));
    
            const requestBody = {
                origin: { location: { latLng: currentOrigin } },
                destination: { location: { latLng: nextDestination } },
                travelMode: 'DRIVE',
                intermediates,
                optimizeWaypointOrder: true,
            };
    
            const fieldMask = 'routes.optimizedIntermediateWaypointIndex,routes.legs,routes.distanceMeters,routes.duration,routes.polyline';
    
            try {
                const response = await axios.post(
                    'https://routes.googleapis.com/directions/v2:computeRoutes',
                    requestBody,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Goog-Api-Key': this.apiKey,
                            'X-Goog-FieldMask': fieldMask,
                        },
                    }
                );
    
                const route = response.data.routes[0];
                fullRoute.data.routes[0].legs.push(...route.legs);
                fullRoute.data.routes[0].distanceMeters += route.distanceMeters;
                fullRoute.data.routes[0].duration += parseInt(route.duration.replace('s', ''), 10) || 0;
                // optional: merge polylines later
                //fullRoute.data.routes[0].polyline.encodedPolyline += route.polyline?.encodedPolyline || '';
                if (route.polyline?.encodedPolyline) {
                    const decoded = polyline.decode(route.polyline.encodedPolyline); // [ [lat, lng], ... ]
                    allDecodedPoints.push(...decoded);
                }

                // update origin for next loop
                currentOrigin = nextDestination;
            } catch (error) {
                console.error('Routing chunk failed:', error.response?.data || error.message);
                throw new Error(`Routing failed at chunk ${i + 1}`);
            }
        }
        fullRoute.data.routes[0].polyline.encodedPolyline = polyline.encode(allDecodedPoints);
        fullRoute.data.routes[0].totalStops = fullRoute.data.routes[0].legs.length + 1; // +1 for the destination
        return fullRoute;
    }

    chunkWaypoints<T>(waypoints: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < waypoints.length; i += chunkSize) {
            chunks.push(waypoints.slice(i, i + chunkSize));
        }
        return chunks;
    }
    

    /**
     * Normalizes the directions response so that downstream processing can use
     * consistent properties (polyline, totalDistance, totalDuration, totalStops).
     * This function handles both the legacy Directions API response and the
     * optimized Routes Preferred API response.
     */
    filterDirectionsResponse(directions: DirectionsResponse | any): {
        polyline: string;
        totalDistance: number;
        totalDuration: number;
        totalStops: number;
    } {
        const route = directions.data.routes[0];
    
        // Compute polyline: Use overview_polyline if available, otherwise try to compute it.
        let polylineStr: string = '';
        if (route.overview_polyline && route.overview_polyline.points){
            polylineStr = route.overview_polyline.points;
        }else if(route.polyline && route.polyline.encodedPolyline) {
            polylineStr = route.polyline.encodedPolyline;
        }
    
        // Compute totalDistance & totalDuration
        let totalDistance = 0;
        let totalDuration = 0;
        let totalStops = 0;
        
        // Legacy response: iterating over legs
        if (typeof route.distanceMeters === 'number' && typeof route.duration === 'string') {
            
            // Optimized response may include properties at the route level.
            // For example, if distanceMeters exists:
            totalDistance = route.distanceMeters;
            // For duration, assuming it's a string like '17101s'
            totalDuration = parseInt(route.duration.replace('s', ''), 10);
            // If no leg details, you might need your own logic to calculate stops.
            totalStops = 0;
        }else if(typeof route.distanceMeters === 'number' && typeof route.duration === 'number'){

            totalDistance = route.distanceMeters;
            totalDuration = route.duration;
            totalStops = 0;
        } 
        else if(route.legs && Array.isArray(route.legs) && route.legs.length > 0) {
            totalDistance = route.legs.reduce((sum: number, leg: any) => {
                // In legacy responses, leg.distance.value (in meters)
                return sum + (leg.distance?.value || 0);
            }, 0);
        
            totalDuration = route.legs.reduce((sum: number, leg: any) => {
                // In legacy responses, leg.duration.value (in seconds)
                return sum + (leg.duration?.value || 0);
            }, 0);
        
            // Total stops is typically the number of legs plus one (origin and destination)
            totalStops = route.legs.length + 1;
        }
    
        return {
            polyline: polylineStr,
            totalDistance,
            totalDuration,
            totalStops,
        };
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
                domain: 'MAP',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

}
