import { Injectable } from '@nestjs/common';
import { route } from '@prisma/client';
import { DriverRepository } from '../driver/driver.repository';
import { EnterpriseRepository } from '../enterprise/enterprise.repository';
import { DirectionsRequestParams } from '../maps/maps.interface';
import { MapsService } from '../maps/maps.service';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateRouteDto } from './dtos/route.dto';
import { RouteData } from './interfaces/route.interface';
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

        async generateRoute(data: CreateRouteDto): Promise<route> {
                const params: DirectionsRequestParams = {
                        origin: data.origin,
                        destination: data.destination,
                        waypoints: data.waypoints,
                };

                try {
                        const directions = await this.mapsService.getDirections(params);

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

                                const totalStops = legPolyline.length;

                                const enterprise = await this.enterpriseRepository.findEnterpriseById(data.enterpriseId);
                                if (!enterprise) {
                                        throw new Error('record not found');
                                }

                                const client = await this.enterpriseRepository.findClientById(data.clientId);
                                if (!client) {
                                        throw new Error('record not found');
                                }

                                const driver = await this.driverRepository.findDriverById(data.driverId);
                                if (!driver) {
                                        throw new Error('record not found');
                                }

                                const vehicle = await this.vehicleRepository.findVehicleById(data.vehicleId);
                                if (!vehicle) {
                                        throw new Error('record not found');
                                }

                                const routeTemplate = await this.routeRepository.findRouteTemplateById(data.routeTemplateId);
                                if (!routeTemplate) {
                                        throw new Error('record not found');
                                }

                                const checklist = await this.enterpriseRepository.createChecklist(client.id_client);
                                const rd: RouteData = {
                                        enterpriseId: data.enterpriseId,
                                        clientId: data.clientId,
                                        vehicleId: data.vehicleId,
                                        driverId: data.driverId,
                                        routeTemplateId: data.routeTemplateId,
                                        name: data.name,
                                        dateStart: new Date(),
                                        dateEnd: new Date(),
                                        polyline: pl,
                                        totalDistance,
                                        totalDuration,
                                        stopInitial: 0,
                                        stopFinal: totalStops,
                                };
                                const newRoute = await this.routeRepository.createRoute(rd);

                                // create checklist_event
                                await this.routeRepository.createChecklistEvent(checklist.id_checklist, newRoute.id_route);

                                // TODO: create a an event for the route but you need to also create stops

                                // totalDistance: `${totalDistance / 1000} km`, // convert meters to kilometers
                                // totalDuration: `${totalDuration / 3600} hours`, // convert seconds to hours
                                // stopInitial: legPolyline[0],
                                // stopFinal: legPolyline[legPolyline.length - 1],

                                return newRoute;
                        }
                } catch (err) {
                        throw new Error(err);
                }
        }

        async findRouteById(id: number): Promise<route> {
                try {
                        return await this.routeRepository.findRouteById(id);
                } catch (err) {
                        console.log(err);
                }
        }
}
