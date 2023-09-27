import { DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { Route, RouteTemplate } from '@prisma/client';
import { DriverRepository } from '../driver/driver.repository';
import { EnterpriseRepository } from '../enterprise/enterprise.repository';
import { DirectionsRequestParams } from '../maps/maps.interface';
import { MapsService } from '../maps/maps.service';
import { DataBaseError, DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateRouteDto } from './dtos/route.dto';
import { CreateRouteParams, FilteredDirectionsData, UpdateRouteTemplateParams } from './interfaces/route.interface';
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
    async generateRoute(body: CreateRouteDto): Promise<Route> {
        try {
            // origen = stop_initial, destination = stop_final which should already exist in the database upon creation of route template
            let routeTemplate = await this.routeRepository.findRouteTemplateRecordById(body.routeTemplateId);

            const origin = await this.routeRepository.getStopCoordinatesFromEventTemplateRecord(routeTemplate.stop_initial);
            const destination = await this.routeRepository.getStopCoordinatesFromEventTemplateRecord(routeTemplate.stop_final);
            const waypoints = await this.routeRepository.getStopCoordinatesFromManyEventTemplateRecords(routeTemplate.id_route_template);

            // if there is no polyline this means the RoutTemplate doesn't have a predefined set of directions for completing the route yet
            // therefore a route must be generated and the data must be updated in the RouteTemplate record
            if (!routeTemplate.polyline) {
                try {
                    const params: DirectionsRequestParams = {
                        origin,
                        destination,
                        waypoints,
                    };
                    // routeTemplate will be equal to the new updated record
                    routeTemplate = await this.updateRouteTemplateDirections(params, routeTemplate.id_route_template);
                } catch (error) {
                    throw new DomainError({
                        domain: 'ROUTE',
                        layer: 'SERVICE',
                        message: `generateRoute: Unable to populate RouteTemplate with id ${routeTemplate.id_route_template} `,
                        cause: error,
                    });
                }
            }

            const enterprise = await this.enterpriseRepository.findEnterpriseRecordById(body.enterpriseId);
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
            return await this.routeRepository.findRouteRecordById(id);
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

    async updateRouteTemplateDirections(params: DirectionsRequestParams, routeTemplateId: number): Promise<RouteTemplate> {
        try {
            const directions = await this.mapsService.getDirections(params);
            if (!directions.data.routes || !directions.data.routes[0]) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `populateRouteTemplate: Unable to generate route, missing DirectionsRoute[] from DirectionsResponseData.routes `,
                });
            }
            const filteredDirections = this.filterDirectionsResponse(directions);

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

    // Extract only the necessary fields from google maps API
    filterDirectionsResponse(directions: DirectionsResponse): FilteredDirectionsData {
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

        const totalStops = legPolyline.length - 2; // we don't take into account point of origin and we also remove index 0 from counter

        // totalDistance: `${totalDistance / 1000} km`, // convert meters to kilometers
        // totalDuration: `${totalDuration / 3600} hours`, // convert seconds to hours
        // stopInitial: legPolyline[0],
        // stopFinal: legPolyline[legPolyline.length - 1],

        const filteredData: FilteredDirectionsData = {
            polyline,
            legPolyline,
            legs,
            totalDistance,
            totalDuration,
            totalStops,
        };
        return filteredData;
    }
}
