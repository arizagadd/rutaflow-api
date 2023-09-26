import { DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { Route, RouteTemplate } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';
import { PopulateRouteTemplateData, RouteData } from './interfaces/route.interface';

@Injectable()
export class RouteRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}

        async createRouteRecord(data: RouteData): Promise<Route> {
                try {
                        const newRoute = await this.prismaRepository.route.create({
                                data: {
                                        id_enterprise: data.enterpriseId,
                                        id_client: data.clientId,
                                        id_vehicle: data.vehicleId,
                                        id_driver: data.driverId,
                                        id_route_template: data.routeTemplateId,
                                        name: data.name,
                                        date_start: new Date(),
                                        date_end: new Date(),
                                        polyline: data.polyline,
                                        total_duration: data.totalDuration,
                                        total_distance: data.totalDistance,
                                        stop_initial: 0,
                                        stop_final: data.stopFinal,
                                        // checklist_event[] TODO: might have to extract these to a function at the service level or controller level
                                        //event[] TODO:  might have to extract these to a function at the service level or controller level
                                },
                        });

                        if (!newRoute) {
                                throw new DataBaseError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'CREATE_RECORD_ERROR',
                                        message: 'createRouteRecord: Unable to create route',
                                });
                        }

                        return newRoute;
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }

        async findRouteById(id: number): Promise<Route> {
                try {
                        const route = await this.prismaRepository.route.findFirst({
                                where: {
                                        id_route: id,
                                },
                        });

                        if (!route) {
                                throw new DataBaseError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `findRouteById: Route with id ${id} not found`,
                                });
                        }

                        return route;
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }

        async findRouteTemplateById(id: number): Promise<RouteTemplate> {
                try {
                        const routeTemplate = await this.prismaRepository.routeTemplate.findFirst({
                                where: {
                                        id_route_template: id,
                                },
                        });

                        if (!routeTemplate) {
                                throw new DataBaseError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `findRouteTemplateById: RouteTemplate with id ${id} not found`,
                                });
                        }

                        return routeTemplate;
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }
        // async fetchEventTemplates(routeTemplateId: number): Promise<EventTemplate[]> {
        //         try {
        //                 return await this.prismaRepository.eventTemplate.findMany({
        //                         where: {
        //                                 id_route_template: routeTemplateId,
        //                         },
        //                 });
        //         } catch (error) {
        //                 throw new UnexpectedError({
        //                         domain: 'ROUTE',
        //                         layer: 'REPOSITORY',
        //                         type: 'UNEXPECTED_ERROR',
        //                         message: error.message,
        //                         cause: error,
        //                 });
        //         }
        // }

        async getStopCoordinatesFromEventTemplate(routeTemplateId: number): Promise<string[]> {
                try {
                        const eventTemplates = await this.prismaRepository.eventTemplate.findMany({
                                where: {
                                        id_route_template: routeTemplateId,
                                },
                                include: {
                                        stop: true,
                                },
                        });

                        const coordinates = eventTemplates.map((event) => {
                                const { lat, lon } = event.stop;
                                return `${lat}, ${lon}`;
                        });

                        return coordinates;
                } catch (error) {
                        throw new UnexpectedError({
                                domain: 'ROUTE',
                                layer: 'REPOSITORY',
                                type: 'UNEXPECTED_ERROR',
                                message: error.message,
                                cause: error,
                        });
                }
        }
        async getOneStopCoordinateFromEventTemplate(stopId: number): Promise<string> {
                try {
                        const eventTemplate = await this.prismaRepository.eventTemplate.findFirst({
                                where: {
                                        id_stop: stopId,
                                },
                                include: {
                                        stop: true,
                                },
                        });

                        // Ensure that the eventTemplate and its related stop are found
                        if (!eventTemplate || !eventTemplate.stop) {
                                throw new DataBaseError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: 'getOneStopCoordinateFromEventTemplate: Stop not found via EventTemplate.',
                                });
                        }

                        const lat = eventTemplate.stop.lat;
                        const lon = eventTemplate.stop.lon;

                        return `${lat}, ${lon}`;
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }
        async updateRouteTemplateRecord(routeTemplateId: number, data: PopulateRouteTemplateData): Promise<void> {
                try {
                        await this.prismaRepository.routeTemplate.update({
                                where: {
                                        id_route_template: routeTemplateId,
                                },
                                data: {
                                        polyline: data.polyline,
                                        total_distance: data.totalDistance,
                                        total_duration: data.totalDuration,
                                        total_stops: data.totalStops,
                                },
                        });
                        console.log('RouteTemplate updated successfully.');
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }

        async matchLegsToEventTemplates(directions: DirectionsResponse, routeTemplateId: number) {
                try {
                        // This function assumes you have already obtained all related EventTemplates and the corresponding Stops for your RouteTemplate
                        const eventTemplates = await this.prismaRepository.eventTemplate.findMany({
                                where: {
                                        id_route_template: routeTemplateId,
                                },
                                include: {
                                        stop: true,
                                },
                        });

                        const legs = directions.data.routes[0].legs;

                        const mappedLegs = legs.map((leg) => {
                                // Find the matching eventTemplate based on the start_location of the leg
                                const matchingEventTemplate = eventTemplates.find((eventTemplate) =>
                                        this.areCoordinatesCloseEnough(
                                                leg.start_location.lat,
                                                leg.start_location.lng,
                                                eventTemplate.stop.lat,
                                                eventTemplate.stop.lon,
                                        ),
                                );

                                if (matchingEventTemplate) {
                                        return {
                                                leg,
                                                pos: String(matchingEventTemplate.pos), // Convert pos to string
                                        };
                                } else {
                                        return null;
                                }
                        });

                        return mappedLegs.filter((item) => item !== null);
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'ROUTE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }

        // Helper function to determine if two sets of coordinates are close enough to be considered a match.
        // This might be necessary because floating point precision could cause minor discrepancies.
        areCoordinatesCloseEnough(lat1, lon1, lat2, lon2, threshold = 0.0001) {
                return Math.abs(lat1 - lat2) <= threshold && Math.abs(lon1 - lon2) <= threshold;
        }
}
