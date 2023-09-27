import { DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { EventStatus, EventTemplate, Route, RouteTemplate, Stop } from '@prisma/client';
import { DirectionsRequestParams } from '../maps/maps.type';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';
import { CreateRouteParams, UpdateRouteTemplateParams } from './types/route.type';

@Injectable()
export class RouteRepository {
    constructor(private readonly prismaRepository: PrismaRepository) {}

    async createRouteRecord(data: CreateRouteParams): Promise<Route> {
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
                    stop_initial: data.stopInitial,
                    stop_final: data.stopFinal,
                    total_stops: data.totalStops,
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
                    message: `createRouteRecord: Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async findRouteRecordById(id: number): Promise<Route> {
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
                    message: `findRouteRecordById: Route with id ${id} not found`,
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
                    message: `findRouteRecordById: Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async findRouteTemplateRecordById(id: number): Promise<RouteTemplate> {
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
                    message: `findRouteTemplateRecordById: RouteTemplate with id ${id} not found`,
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
                    message: `findRouteTemplateRecordById: Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }
    async fetchAllEventTemplateRecords(routeTemplateId: number): Promise<EventTemplate[]> {
        try {
            return await this.prismaRepository.eventTemplate.findMany({
                where: {
                    id_route_template: routeTemplateId,
                },
            });
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `fetchAllEventTemplateRecords: Error:${error.message}`,
                cause: error,
            });
        }
    }

    async setUpDirectionsParams(routeTemplateId: number, stopInitial: Stop, stopFinal: Stop): Promise<DirectionsRequestParams> {
        try {
            const origin = `${stopInitial.lat}, ${stopInitial.lon}`;
            const destination = `${stopFinal.lat}, ${stopFinal.lon}`;

            // Fetching the routeTemplate to get stop_initial and stop_final
            const routeTemplate = await this.prismaRepository.routeTemplate.findUnique({
                where: { id_route_template: routeTemplateId },
                select: {
                    stop_initial: true,
                    stop_final: true,
                },
            });

            if (!routeTemplate) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `setupDirectionsParams: RouteTemplate with id ${routeTemplateId} not found`,
                });
            }

            const eventTemplates = await this.prismaRepository.eventTemplate.findMany({
                where: {
                    id_route_template: routeTemplateId,
                },
                include: {
                    stop: true,
                },
            });

            const coordinatesSet = new Set<string>(); // Using Set to ensure uniqueness

            eventTemplates.forEach((event) => {
                const { lat, lon } = event.stop;

                // Checking if the coordinates are neither for stop_initial nor for stop_final
                if (!((lat === stopInitial?.lat && lon === stopInitial?.lon) || (lat === stopFinal?.lat && lon === stopFinal?.lon))) {
                    coordinatesSet.add(`${lat}, ${lon}`);
                }
            });

            const requestData: DirectionsRequestParams = {
                origin,
                destination,
                waypoints: Array.from(coordinatesSet), // Converting Set back to Array
            };

            return requestData;
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `getStopCoordinatesFromManyEventTemplateRecords: Error:${error.message}`,
                cause: error,
            });
        }
    }

    async updateRouteTemplateRecord(routeTemplateId: number, data: UpdateRouteTemplateParams): Promise<RouteTemplate> {
        try {
            const routeTemplate = await this.prismaRepository.routeTemplate.update({
                where: {
                    id_route_template: routeTemplateId,
                },
                data: {
                    id_enterprise: data.enterpriseId,
                    id_driver: data.driverId,
                    name: data.name,
                    polyline: data.polyline,
                    description: data.description,
                    color: data.color,
                    symbol: data.symbol,
                    total_duration: data.totalDuration,
                    total_distance: data.totalDistance,
                    total_stops: data.totalStops,
                    stop_initial: data.stopInitial,
                    stop_final: data.stopFinal,
                    tag: data.tag,
                },
            });
            if (!routeTemplate) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UPDATE_RECORD_ERROR',
                    message: `updateRouteTemplateRecord: Unable to update RouteTemplate with id ${routeTemplateId} `,
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
                    message: `updateRouteTemplateRecord: Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }
    // matches order of points to the pos field in the corresponding event_template by checking lat, lng values from
    // Google DirectionsResponse object and stop records from event_templates
    async matchLegsToManyEventTemplateRecords(directions: DirectionsResponse, routeTemplateId: number) {
        try {
            const legs = directions.data.routes[0].legs;
            const updatePromises = [];

            // start_location represents the origin coordinates we passed to the setUpDirectionsParams
            const latRounded = parseFloat(legs[0].start_location.lat.toFixed(3));
            const lngRounded = parseFloat(legs[0].start_location.lng.toFixed(3));

            // setup origin as pos 0
            const originStop = await this.prismaRepository.stop.findFirst({
                where: {
                    lat: {
                        gte: latRounded - 0.0005,
                        lte: latRounded + 0.0005,
                    },
                    lon: {
                        gte: lngRounded - 0.0005,
                        lte: lngRounded + 0.0005,
                    },
                },
            });
            if (!originStop) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `matchLegsToManyEventTemplateRecord: Stop with lat${latRounded} and lng ${lngRounded} not found in DB `,
                });
            }
            const correspondingOriginEventTemplate = await this.prismaRepository.eventTemplate.findFirst({
                where: {
                    id_stop: originStop.id_stop,
                    id_route_template: routeTemplateId,
                },
            });
            const updateOriginEventTemplatePos = this.prismaRepository.eventTemplate.update({
                where: { id_event_template: correspondingOriginEventTemplate.id_event_template },
                data: { pos: 0 },
            });
            updatePromises.push(updateOriginEventTemplatePos);

            for (const [index, leg] of legs.entries()) {
                // Round to the 3rd decimal place
                const latRounded = parseFloat(leg.end_location.lat.toFixed(3));
                const lngRounded = parseFloat(leg.end_location.lng.toFixed(3));

                // Query for the stop with matching lat and lon coordinates up to 3rd decimal place
                const matchingStop = await this.prismaRepository.stop.findFirst({
                    where: {
                        lat: {
                            gte: latRounded - 0.0005,
                            lte: latRounded + 0.0005,
                        },
                        lon: {
                            gte: lngRounded - 0.0005,
                            lte: lngRounded + 0.0005,
                        },
                    },
                });

                if (matchingStop) {
                    const correspondingEventTemplate = await this.prismaRepository.eventTemplate.findFirst({
                        where: {
                            id_stop: matchingStop.id_stop,
                            id_route_template: routeTemplateId,
                        },
                    });

                    if (correspondingEventTemplate) {
                        const updatePromise = this.prismaRepository.eventTemplate.update({
                            where: { id_event_template: correspondingEventTemplate.id_event_template },
                            data: { pos: index + 1 },
                        });
                        updatePromises.push(updatePromise);
                    }
                }
            }

            // Execute all update promises in a single transaction
            const results = await this.prismaRepository.$transaction(updatePromises);
            return results;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `matchLegsToManyEventTemplateRecords: Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async createEventFromEventTemplateRecord(routeTemplateId: number, routeId: number) {
        try {
            const eventTemplates = await this.prismaRepository.eventTemplate.findMany({
                where: { id_route_template: routeTemplateId },
            });

            await Promise.all(
                eventTemplates.map(async (template) => {
                    return this.prismaRepository.event.create({
                        data: {
                            id_route: routeId,
                            id_stop: template.id_stop,
                            pos: template.pos,
                            status: EventStatus.PENDING,
                        },
                    });
                }),
            );
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `createEventFromEventTemplateRecord: Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    // // Helper function to determine if two sets of coordinates are close enough to be considered a match.
    // // This might be necessary because floating point precision could cause minor discrepancies.
    // areCoordinatesCloseEnough(lat1, lon1, lat2, lon2, threshold = 0.0001) {
    //         return Math.abs(lat1 - lat2) <= threshold && Math.abs(lon1 - lon2) <= threshold;
    // }
}
