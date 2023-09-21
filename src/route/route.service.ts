import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../driver/driver.repository';
import { EnterpriseRepository } from '../enterprise/enterprise.repository';
import { MapsService } from '../maps/maps.service';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { RouteData } from './route.interface';
import { RouteRepository } from './route.repository';

@Injectable()
export class RouteService {
        constructor(
                private readonly mapsService: MapsService,
                private readonly routeRepository: RouteRepository,
                private readonly enterpriseRepository: EnterpriseRepository,
                private readonly vehicleRepository: VehicleRepository,
                private readonly driverRepository: DriverRepository,
        ) {}
        async generateRoute(data: RouteData) {
                try {
                        const directions = await this.mapsService.getDirections(data);

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

                                const enterprise = await this.enterpriseRepository.findEnterpriseById(data.enterpriseId);
                                const client = await this.enterpriseRepository.findClientById(data.clientId);
                                const driver = await this.driverRepository.findDriverById(data.driverId);
                                const vehicle = await this.vehicleRepository.findVehicleById(data.vehicleId);
                                const routeTemplate = await this.routeRepository.findRouteTemplateById(data.routeTemplateId);

                                // representation of the Route Entity in DB
                                const routeObj = {
                                        id_enterprise: enterprise.id_enterprise,
                                        id_client: client.id_client,
                                        id_vehicle: vehicle.id_vehicle,
                                        id_driver: driver.id_driver,
                                        id_route_template: routeTemplate.id_route_template,
                                        name: 'LA - Colorado',
                                        dateStart: new Date(),
                                        dateEnd: 'evening',
                                        polyline: pl,
                                        // totalDistance: `${totalDistance / 1000} km`, // convert meters to kilometers
                                        // totalDuration: `${totalDuration / 3600} hours`, // convert seconds to hours
                                        totalDistance,
                                        totalDuration,
                                        stopInitial: legPolyline[0],
                                        stopFinal: legPolyline[legPolyline.length - 1],
                                };

                                const result = await this.routeRepository.createRoute(routeObj);
                                console.log(result);

                                return { status: 'ok' };
                        }
                } catch (error) {
                        throw new Error('Unable to fetch directions from Google Maps API.');
                }
        }
}
