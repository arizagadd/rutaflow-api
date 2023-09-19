import { Client, DirectionsResponse, LatLng, TravelMode } from '@googlemaps/google-maps-services-js';
import { geocode } from '@googlemaps/google-maps-services-js/dist/geocode/geocode';
import { Injectable } from '@nestjs/common';

// interface DirectionsRequestParams {
//         origin: string;
//         destination: string;
//         // mode: TravelMode;
//         waypoints: LatLng[];
//         key: string;
// }

@Injectable()
export class MapsService {
        private googleMapsClient: Client;
        private apiKey: string;

        constructor() {
                this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
                this.googleMapsClient = new Client({});
        }

        public async getDirections(data: any): Promise<DirectionsResponse> {
                const origin = await this.convertLocationToLatLng(data.origin);
                const destination = await this.convertLocationToLatLng(data.destination);
                const waypoints: LatLng[] = await this.convertLocationsToLatLng(data.waypoints);

                return await this.googleMapsClient.directions({
                        params: {
                                origin,
                                destination,
                                mode: TravelMode.driving,
                                waypoints,
                                key: this.apiKey,
                        },
                });
        }

        public isLatLngFormat(location: string): boolean {
                const latLngRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
                return latLngRegex.test(location);
        }

        public async convertLocationToLatLng(location: string): Promise<LatLng> {
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

        public async convertLocationsToLatLng(locations: string[]): Promise<LatLng[]> {
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
}
