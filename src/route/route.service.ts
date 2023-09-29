import { Injectable } from '@nestjs/common';
import { EventStatus, Route, RouteTemplate, Stop } from '@prisma/client';
import { DriverRepository } from '../driver/driver.repository';
import { EnterpriseRepository } from '../enterprise/enterprise.repository';
import { MapsService } from '../maps/maps.service';
import { DirectionsRequestParams } from '../maps/maps.type';
import { DataBaseError, DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { StopRepository } from '../stop/stop.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateRouteDto, UpdateRouteDto } from './dtos/route.dto';
import { RouteRepository } from './route.repository';
import { CreateRouteParams, UpdateRouteParams, UpdateRouteTemplateParams } from './types/route.type';

@Injectable()
export class RouteService {
    constructor(
        private readonly mapsService: MapsService,
        private readonly routeRepository: RouteRepository,
        private readonly enterpriseRepository: EnterpriseRepository,
        private readonly vehicleRepository: VehicleRepository,
        private readonly driverRepository: DriverRepository,
        private readonly stopRepository: StopRepository,
    ) {}

    // Generates the route that the driver will follow to complete a journey
    async generateRoute(body: CreateRouteDto): Promise<Route> {
        try {
            // origen = stop_initial, destination = stop_final which should already exist in the database upon creation of route template
            let routeTemplate = await this.routeRepository.findRouteTemplateRecordById(body.routeTemplateId);
            //TODO: handle empty waypoint array
            const stopInitial = await this.stopRepository.findStopRecordById(routeTemplate.stop_initial);
            const stopFinal = await this.stopRepository.findStopRecordById(routeTemplate.stop_final);
            const params = await this.routeRepository.setUpRouteTemplateDirectionsParams(
                routeTemplate.id_route_template,
                stopInitial,
                stopFinal,
            );

            // if there is no polyline this means the RoutTemplate doesn't have a predefined set of directions for completing the route yet
            // therefore a route must be generated and the data must be updated in the RouteTemplate record
            if (!routeTemplate.polyline) {
                try {
                    //routeTemplate will be equal to the new updated record
                    routeTemplate = await this.updateRouteTemplateDirections(routeTemplate.id_route_template, params);
                } catch (error) {
                    throw new DomainError({
                        domain: 'ROUTE',
                        layer: 'SERVICE',
                        message: `Unable to populate directions in RouteTemplate with id ${routeTemplate.id_route_template} `,
                        cause: error,
                    });
                }
            }

            const enterprise = await this.enterpriseRepository.findEnterpriseRecordById(routeTemplate.id_enterprise);
            const driver = await this.driverRepository.findDriverRecordById(body.driverId);
            const vehicle = await this.vehicleRepository.findVehicleRecordById(body.vehicleId);
            const client = await this.enterpriseRepository.findClientRecordById(body.clientId);

            const routeData: CreateRouteParams = {
                enterpriseId: enterprise.id_enterprise,
                clientId: client.id_client,
                vehicleId: vehicle.id_vehicle,
                driverId: driver.id_driver,
                routeTemplateId: routeTemplate.id_route_template,
                name: `${routeTemplate.name} 26-09-2023`,
                dateStart: new Date(),
                dateEnd: new Date(),
                polyline: routeTemplate.polyline,
                totalDistance: routeTemplate.total_distance,
                totalDuration: routeTemplate.total_duration,
                totalStops: routeTemplate.total_stops,
                stopInitial: routeTemplate.stop_initial,
                stopFinal: routeTemplate.stop_final,
            };
            const route = await this.routeRepository.createRouteRecord(routeData);

            // creates the events that will be related to the newly created route
            await this.routeRepository.createEventFromEventTemplateRecord(routeTemplate.id_route_template, route.id_route);

            return route;
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
                    message: 'Unable to generate route',
                    cause: error,
                });
            }
            // Otherwise throw Unexpected error
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async updateRouteTrajectory(body: UpdateRouteDto): Promise<Route> {
        try {
            let route = await this.routeRepository.findRouteRecordById(body.routeId);
            const newStopInitial = await this.stopRepository.findStopRecordById(body.stopInitial);
            const newStopFinal = await this.stopRepository.findStopRecordById(body.stopFinal);
            const newStopWaypoints = await this.stopRepository.findManyStopsById(body.stopWaypoints);

            const params = await this.mapsService.setUpRouteDirectionsParams(newStopInitial, newStopFinal, newStopWaypoints);
            route = await this.updateRouteDirections(route, newStopInitial, newStopFinal, params);

            return route;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to update route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async updateRouteTemplateDirections(routeTemplateId: number, params: DirectionsRequestParams): Promise<RouteTemplate> {
        try {
            const directions = await this.mapsService.getDirections(params);
            if (!directions.data.routes || !directions.data.routes[0]) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to generate route, missing DirectionsRoute[] from DirectionsResponseData.routes `,
                });
            }
            const filteredDirections = this.mapsService.filterDirectionsResponse(directions);

            const routeTemplateData: UpdateRouteTemplateParams = {
                polyline: filteredDirections.polyline,
                totalDistance: filteredDirections.totalDistance,
                totalDuration: filteredDirections.totalDuration,
                totalStops: filteredDirections.totalStops,
            };
            const routeTemplate = await this.routeRepository.updateRouteTemplateRecord(routeTemplateId, routeTemplateData);
            await this.routeRepository.matchLegsToManyEventTemplateRecords(directions, routeTemplateId);

            return routeTemplate;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to get route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async updateRouteDirections(
        route: Route,
        newStopInitial: Stop,
        newStopFinal: Stop,
        newDirections: DirectionsRequestParams,
    ): Promise<Route> {
        try {
            const directions = await this.mapsService.getDirections(newDirections);
            if (!directions.data.routes || !directions.data.routes[0]) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to generate route, missing DirectionsRoute[] from DirectionsResponseData.routes `,
                });
            }
            const filteredDirections = this.mapsService.filterDirectionsResponse(directions);

            const events = await this.routeRepository.findManyEventRecordsByRouteId(route.id_route);
            const completedEvents = events.filter((e) => e.status === EventStatus.COMPLETED);
            const totalStops = filteredDirections.totalStops + completedEvents.length;
            const routeData: UpdateRouteParams = {
                polyline: filteredDirections.polyline,
                totalDistance: filteredDirections.totalDistance,
                totalDuration: filteredDirections.totalDuration,
                totalStops: totalStops,
                stopInitial: newStopInitial.id_stop,
                stopFinal: newStopFinal.id_stop,
            };
            const updatedRoute = this.routeRepository.updateRouteRecord(route.id_route, routeData);
            await this.routeRepository.matchLegsToManyEventRecords(route, directions);

            return updatedRoute;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to update route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async getRoute(id: number): Promise<Route> {
        try {
            return await this.routeRepository.findRouteRecordById(id);
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to get route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }
}
