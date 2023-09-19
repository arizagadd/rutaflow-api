import { Client, DirectionsResponse, LatLng, TravelMode } from '@googlemaps/google-maps-services-js';
import { geocode } from '@googlemaps/google-maps-services-js/dist/geocode/geocode';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleMapsService {
        private client: Client;
        private apiKey: string;

        constructor() {
                this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
                this.client = new Client({});
        }

        private isLatLngFormat(location: string): boolean {
                const latLngRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
                return latLngRegex.test(location);
        }

        private async convertLocationToLatLng(location: string): Promise<LatLng> {
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
                        throw new Error(`Cannot convert location "${location}" to latitude and longitude.`);
                }
        }

        private async convertLocationsToLatLng(locations: string[]): Promise<LatLng[]> {
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

        async generateRoute(data: any) {
                const locations = ['Los Angeles, CA', '39.5501, -105.7821', 'Denver, CO'];

                // waypoints
                const wp: LatLng[] = await this.convertLocationsToLatLng(locations);

                try {
                        const dr: DirectionsResponse = await this.client.directions({
                                params: {
                                        origin: '34.1478, -118.1445',
                                        destination: '40.7128, -74.0060',
                                        mode: TravelMode.driving,
                                        waypoints: wp,
                                        key: this.apiKey,
                                },
                        });

                        if (dr.data.routes && dr.data.routes[0]) {
                                // get complete route polyline
                                const pl = dr.data.routes[0].overview_polyline.points;

                                // legs represent each stop (waypoint) within the route
                                const legs = dr.data.routes[0].legs;

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

                                // representation of the Route Entity in DB
                                const routeObj = {
                                        name: 'LA - Colorado',
                                        dateStart: new Date(),
                                        dateEnd: 'evening',
                                        polyline: pl,
                                        totalDistance: `${totalDistance / 1000} km`, // convert meters to kilometers
                                        totalDuration: `${totalDuration / 3600} hours`, // convert seconds to hours
                                        stopInitial: legPolyline[0],
                                        stopFinal: legPolyline[legPolyline.length - 1],
                                };

                                return 'ok';
                        }
                } catch (error) {
                        throw new Error('Unable to fetch directions from Google Maps API.');
                }
        }
}
