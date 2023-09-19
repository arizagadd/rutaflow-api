import { DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { MapsService } from '../maps/maps.service';

@Injectable()
export class RouteService {
        constructor(private readonly mapsService: MapsService) {}
        async generateRoute(data: any) {
                try {
                        const directions: DirectionsResponse = await this.mapsService.getDirections(data);

                        if (directions.data.routes && directions.data.routes[0]) {
                                // get complete route polyline
                                const pl = directions.data.routes[0].overview_polyline.points;

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
