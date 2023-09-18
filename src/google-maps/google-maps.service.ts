import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleMapsService {
        private client: Client;
        private apiKey: string;

        constructor() {
                this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
                this.client = new Client({});
        }
        async generateRoute(data: any) {
                const wp = ['Chicago, IL', 'Denver, CO', 'San Francisco, CA'];
                // const input =
                //         'Chicago,IL|Denver,CO|Phoenix,AZ|Dallas,TX|Houston,TX|Austin,TX|San+Antonio,TX|Miami,FL|Orlando,FL';

                // const wp = waypoints.split('|');

                // console.log(wp);

                try {
                        const response = await this.client.directions({
                                params: {
                                        origin: 'Los Angeles, CA',
                                        destination: 'Colorado, CO',
                                        mode: TravelMode.driving,
                                        waypoints: wp,
                                        key: this.apiKey,
                                },
                        });
                        if (response.data.routes && response.data.routes[0]) {
                                // return response.data;

                                // get complete route polyline
                                const polyline = response.data.routes[0].overview_polyline.points;
                                console.log(polyline);
                                // return response.data.routes[0].overview_polyline.points;

                                // legs represent each stop (waypoint) within the route
                                const legs = response.data.routes[0].legs;

                                // Calculate total distance and duration by summing up each leg's value
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
                                console.log(legPolyline);

                                // representation of the Route Entity in DB
                                const routeObj = {
                                        name: 'LA - Colorado',
                                        dateStart: new Date(),
                                        dateEnd: 'evening',
                                        polyline,
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
