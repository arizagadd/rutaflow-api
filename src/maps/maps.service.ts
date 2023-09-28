import { Client, DirectionsResponse, LatLng, TravelMode } from '@googlemaps/google-maps-services-js';
import { geocode } from '@googlemaps/google-maps-services-js/dist/geocode/geocode';
import { Injectable } from '@nestjs/common';
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
            const waypoints: LatLng[] = await this.convertLocationsToLatLng(data.waypoints);

            return await this.googleMapsClient.directions({
                params: {
                    origin,
                    destination,
                    mode: TravelMode.driving,
                    waypoints,
                    optimize: true,
                    key: this.apiKey,
                },
            });
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
}
