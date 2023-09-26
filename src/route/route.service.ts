import { DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { Route } from '@prisma/client';
import { DriverRepository } from '../driver/driver.repository';
import { EnterpriseRepository } from '../enterprise/enterprise.repository';
import { DirectionsRequestParams } from '../maps/maps.interface';
import { MapsService } from '../maps/maps.service';
import { DataBaseError, DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateRouteDto } from './dtos/route.dto';
import { PopulateRouteTemplateData, RouteData } from './interfaces/route.interface';
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
        // this generates the route that the driver will follow to complete a journey
        async generateRoute(data: CreateRouteDto): Promise<Route> {
                const params: DirectionsRequestParams = {
                        origin: data.origin,
                        destination: data.destination,
                        waypoints: data.waypoints,
                };

                try {
                        // origen = stop_initial, destination = stop_final which should already exist in the database upon creation of route template
                        const routeTemplate = await this.routeRepository.findRouteTemplateById(data.routeTemplateId);

                        const origin = await this.routeRepository.getOneStopCoordinateFromEventTemplate(routeTemplate.stop_initial);
                        const destination = await this.routeRepository.getOneStopCoordinateFromEventTemplate(routeTemplate.stop_final);
                        const waypoints = await this.routeRepository.getStopCoordinatesFromEventTemplate(routeTemplate.id_route_template);

                        if (!routeTemplate.polyline) {
                                await this.populateRouteTemplate(origin, destination, waypoints, routeTemplate.id_route_template);
                        }

                        const directions = await this.mapsService.getDirections(params);
                        if (!directions.data.routes || !directions.data.routes[0]) {
                                throw new DomainError({
                                        domain: 'ROUTE',
                                        layer: 'SERVICE',
                                        message: `generateRoute: Unable to generate route, missing DirectionsRoute[] from DirectionsResponseData.routes `,
                                });
                        }
                        const directionsData = this.extractDirectionsData(directions);

                        await this.enterpriseRepository.findEnterpriseById(data.enterpriseId);
                        await this.driverRepository.findDriverById(data.driverId);
                        await this.vehicleRepository.findVehicleById(data.vehicleId);
                        await this.routeRepository.findRouteTemplateById(data.routeTemplateId);

                        const client = await this.enterpriseRepository.findClientById(data.clientId);
                        const checklist = await this.enterpriseRepository.createChecklistRecord(client.id_client);

                        const route: RouteData = {
                                enterpriseId: data.enterpriseId,
                                clientId: data.clientId,
                                vehicleId: data.vehicleId,
                                driverId: data.driverId,
                                routeTemplateId: data.routeTemplateId,
                                name: data.name,
                                dateStart: new Date(),
                                dateEnd: new Date(),
                                polyline: directionsData.polyline,
                                totalDistance: directionsData.totalDistance,
                                totalDuration: directionsData.totalDuration,
                                stopInitial: routeTemplate.stop_initial,
                                stopFinal: routeTemplate.stop_final,
                        };
                        const routeRecord = await this.routeRepository.createRouteRecord(route);

                        // create checklist_event
                        await this.enterpriseRepository.createChecklistEventRecord(checklist.id_checklist, routeRecord.id_route);

                        // totalDistance: `${totalDistance / 1000} km`, // convert meters to kilometers
                        // totalDuration: `${totalDuration / 3600} hours`, // convert seconds to hours
                        // stopInitial: legPolyline[0],
                        // stopFinal: legPolyline[legPolyline.length - 1],

                        return routeRecord;
                } catch (error) {
                        // Domain specific error not related to DB operations
                        if (error instanceof DomainError) {
                                throw error;
                        }
                        // Database specific error
                        if (error instanceof DataBaseError) {
                                throw new DomainError({
                                        domain: 'ROUTE',
                                        layer: 'SERVICE',
                                        message: 'generateRoute: Unable to generate route',
                                        cause: error,
                                });
                        }
                        // Otherwise throw Unexpected error
                        throw new UnexpectedError({
                                domain: 'ROUTE',
                                layer: 'SERVICE',
                                type: 'UNEXPECTED_ERROR',
                                message: error.message,
                                cause: error,
                        });
                }
        }

        async getRoute(id: number): Promise<Route> {
                try {
                        return await this.routeRepository.findRouteById(id);
                } catch (error) {
                        if (error instanceof DomainError) {
                                throw error;
                        }

                        if (error instanceof DataBaseError) {
                                throw new DomainError({
                                        domain: 'ROUTE',
                                        layer: 'SERVICE',
                                        message: `getRoute: Unable to get route`,
                                        cause: error,
                                });
                        }

                        throw new UnexpectedError({
                                domain: 'ROUTE',
                                layer: 'SERVICE',
                                type: 'UNEXPECTED_ERROR',
                                message: error.message,
                                cause: error,
                        });
                }
        }

        async populateRouteTemplate(
                origin: string,
                destination: string,
                waypoints: string[],
                routeTemplateId: number,
        ) /**Promise<RouteTemplate> */ {
                try {
                        const params: DirectionsRequestParams = {
                                origin,
                                destination,
                                waypoints,
                        };

                        const directions = await this.mapsService.getDirections(params);
                        if (!directions.data.routes || !directions.data.routes[0]) {
                                throw new DomainError({
                                        domain: 'ROUTE',
                                        layer: 'SERVICE',
                                        message: `generateRoute: Unable to generate route, missing DirectionsRoute[] from DirectionsResponseData.routes `,
                                });
                        }
                        const directionsData = this.extractDirectionsData(directions);

                        const data: PopulateRouteTemplateData = {
                                polyline: directionsData.polyline,
                                totalDistance: directionsData.totalDistance,
                                totalDuration: directionsData.totalDuration,
                                totalStops: directionsData.totalStops,
                        };
                        await this.routeRepository.matchLegsToEventTemplates(directions, routeTemplateId);
                        console.log('did match');
                        await this.routeRepository.updateRouteTemplateRecord(routeTemplateId, data);
                } catch (error) {
                        if (error instanceof DomainError) {
                                throw error;
                        }

                        if (error instanceof DataBaseError) {
                                throw new DomainError({
                                        domain: 'ROUTE',
                                        layer: 'SERVICE',
                                        message: `getRoute: Unable to get route`,
                                        cause: error,
                                });
                        }

                        throw new UnexpectedError({
                                domain: 'ROUTE',
                                layer: 'SERVICE',
                                type: 'UNEXPECTED_ERROR',
                                message: error.message,
                                cause: error,
                        });
                }
        }

        extractDirectionsData(directions: DirectionsResponse) {
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

                const totalStops = legPolyline.length;

                return {
                        polyline,
                        legPolyline,
                        legs,
                        totalDistance,
                        totalDuration,
                        totalStops,
                };
        }
}
