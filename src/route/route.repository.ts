import { DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { Event, EventStatus, EventTemplate, Route, RouteTemplate, Stop } from '@prisma/client';
import { DirectionsRequestParams } from '../maps/maps.type';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';
import { CreateRouteParams, UpdateRouteParams, UpdateRouteTemplateParams } from './types/route.type';

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
                    message: 'Unable to create route',
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
                    message: `Error:${error.message}`,
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
                    message: `Route with id ${id} not found`,
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
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async findEventRecordByRouteId(routeId: number): Promise<Event> {
        try {
            const event = await this.prismaRepository.event.findFirst({
                where: {
                    id_route: routeId,
                },
            });

            if (!event) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Event with Route id ${routeId} not found`,
                });
            }

            return event;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async findManyEventRecordsByRouteId(routeId: number): Promise<Event[]> {
        try {
            const events = await this.prismaRepository.event.findMany({
                where: {
                    id_route: routeId,
                },
            });
            if (!events) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Events with Route id ${routeId} not found`,
                });
            }
            return events;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
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
                    message: `RouteTemplate with id ${id} not found`,
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
                    message: `Error:${error.message}`,
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
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async prepareRouteTemplateDirections(routeTemplateId: number, stopInitial: Stop, stopFinal: Stop): Promise<DirectionsRequestParams> {
        try {
            const origin = `${stopInitial.lat}, ${stopInitial.lon}`;
            const destination = `${stopFinal.lat}, ${stopFinal.lon}`;
            const coordinatesSet = new Set<string>(); // Using Set to ensure uniqueness
            let requestData: DirectionsRequestParams;

            const eventTemplates = await this.prismaRepository.eventTemplate.findMany({
                where: {
                    id_route_template: routeTemplateId,
                },
                include: {
                    stop: true,
                },
            });

            eventTemplates.forEach((event) => {
                const { lat, lon } = event.stop;

                // Check if the coordinates are neither for stop_initial nor for stop_final
                if (!((lat === stopInitial.lat && lon === stopInitial.lon) || (lat === stopFinal.lat && lon === stopFinal.lon))) {
                    coordinatesSet.add(`${lat}, ${lon}`);
                }
            });

            if (!coordinatesSet.size) {
                requestData = {
                    origin,
                    destination,
                };
            } else {
                requestData = {
                    origin,
                    destination,
                    waypoints: Array.from(coordinatesSet), // Convert Set back to Array
                };
            }

            return requestData;
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
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
                    message: `Unable to update RouteTemplate with id ${routeTemplateId} `,
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
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    // matches order of points to the pos field in the corresponding event_template by checking lat, lng values from
    // Google DirectionsResponse object and stop records from event_templates
    async matchLegsToManyEventTemplateRecords(routeTemplateId: number, directions: DirectionsResponse): Promise<void> {
        try {
            const legs = directions.data.routes[0].legs;
            const updatePromises = [];

            // start_location represents the origin coordinates we passed to the setUpDirectionsParams
            const originLatRounded = parseFloat(legs[0].start_location.lat.toFixed(3));
            const originLngRounded = parseFloat(legs[0].start_location.lng.toFixed(3));

            // setup origin as pos 0
            const originStop = await this.prismaRepository.stop.findFirst({
                where: {
                    lat: {
                        gte: originLatRounded - 0.0005,
                        lte: originLatRounded + 0.0005,
                    },
                    lon: {
                        gte: originLngRounded - 0.0005,
                        lte: originLngRounded + 0.0005,
                    },
                },
            });
            if (!originStop) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Stop with lat${originLatRounded} and lng ${originLngRounded} not found in DB `,
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
                const waypointsLatRounded = parseFloat(leg.end_location.lat.toFixed(3));
                const waypointsLngRounded = parseFloat(leg.end_location.lng.toFixed(3));

                // Query for the stop with matching lat and lon coordinates up to 3rd decimal place
                const matchingStop = await this.prismaRepository.stop.findFirst({
                    where: {
                        lat: {
                            gte: waypointsLatRounded - 0.0005,
                            lte: waypointsLatRounded + 0.0005,
                        },
                        lon: {
                            gte: waypointsLngRounded - 0.0005,
                            lte: waypointsLngRounded + 0.0005,
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
            await this.prismaRepository.$transaction(updatePromises);
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async updateRouteRecord(routeId: number, data: UpdateRouteParams): Promise<Route> {
        try {
            let stopInitial: number;

            // check if current initial stop has been completed before overwriting
            const event = await this.prismaRepository.event.findFirst({
                where: {
                    id_route: routeId,
                    pos: 0,
                },
                select: {
                    status: true,
                    stop: true,
                },
            });

            if (event.status === EventStatus.COMPLETED) {
                stopInitial = event.stop.id_stop;
            } else {
                stopInitial = data.stopInitial;
            }

            const route = await this.prismaRepository.route.update({
                where: {
                    id_route: routeId,
                },
                data: {
                    id_enterprise: data.enterpriseId,
                    id_driver: data.driverId,
                    name: data.name,
                    polyline: data.polyline,
                    total_duration: data.totalDuration,
                    total_distance: data.totalDistance,
                    total_stops: data.totalStops,
                    stop_initial: stopInitial,
                    stop_final: data.stopFinal,
                },
            });
            if (!route) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UPDATE_RECORD_ERROR',
                    message: `Unable to update Route with id ${routeId} `,
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
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async matchLegsToManyEventRecords(route: Route, params: DirectionsResponse): Promise<void> {
        let posindex = 0;
        const updatePromises = [];
        const legs = params.data.routes[0].legs;

        // start_location represents the origin coordinates we passed to the setUpDirectionsParams
        const originLatRounded = parseFloat(legs[0].start_location.lat.toFixed(3));
        const originLngRounded = parseFloat(legs[0].start_location.lng.toFixed(3));

        try {
            const events = await this.prismaRepository.event.findMany({
                where: {
                    id_route: route.id_route,
                },
                select: {
                    stop: true,
                    status: true,
                },
            });
            const completedEvents = events.filter((e) => e.status === EventStatus.COMPLETED);

            const routeOriginEvent = await this.prismaRepository.event.findFirst({
                where: {
                    id_route: route.id_route,
                    pos: 0,
                },
                select: {
                    stop: true,
                    status: true,
                },
            });

            if (routeOriginEvent.status !== EventStatus.COMPLETED) {
                // no events have been completed, even the original point of origin therefore delete all events related to route
                await this.prismaRepository.event.deleteMany({
                    where: {
                        id_route: route.id_route,
                        status: {
                            not: EventStatus.COMPLETED,
                        },
                    },
                });

                const newRouteOrigin = await this.prismaRepository.stop.findFirst({
                    where: {
                        lat: {
                            gte: originLatRounded - 0.0005,
                            lte: originLatRounded + 0.0005,
                        },
                        lon: {
                            gte: originLngRounded - 0.0005,
                            lte: originLngRounded + 0.0005,
                        },
                    },
                });
                if (!newRouteOrigin) {
                    throw new DataBaseError({
                        domain: 'ROUTE',
                        layer: 'REPOSITORY',
                        type: 'GET_RECORD_ERROR',
                        message: `Stop with lat${originLatRounded} and lng ${originLngRounded} not found in DB `,
                    });
                }
                //setup new stop_initial in route, and as event with pos 0
                const newOriginStopEvent = this.prismaRepository.event.create({
                    data: {
                        id_route: route.id_route,
                        id_stop: newRouteOrigin.id_stop,
                        status: EventStatus.PENDING,
                        pos: 0,
                    },
                });
                updatePromises.push(newOriginStopEvent);

                // rest of waypoints will represent correct sequence after 0
                posindex += 1;
            } else {
                // Otherwise only delete events with status not equal to COMPLETED
                await this.prismaRepository.event.deleteMany({
                    where: {
                        id_route: route.id_route,
                        status: {
                            not: EventStatus.COMPLETED,
                        },
                    },
                });
                const originWaypoint = await this.prismaRepository.stop.findFirst({
                    where: {
                        lat: {
                            gte: originLatRounded - 0.0005,
                            lte: originLatRounded + 0.0005,
                        },
                        lon: {
                            gte: originLngRounded - 0.0005,
                            lte: originLngRounded + 0.0005,
                        },
                    },
                });
                if (!originWaypoint) {
                    throw new DataBaseError({
                        domain: 'ROUTE',
                        layer: 'REPOSITORY',
                        type: 'GET_RECORD_ERROR',
                        message: `Stop with lat${originLatRounded} and lng ${originLngRounded} not found in DB `,
                    });
                }

                const newOriginStopEvent = this.prismaRepository.event.create({
                    data: {
                        id_route: route.id_route,
                        id_stop: originWaypoint.id_stop,
                        status: EventStatus.PENDING,
                        pos: 0 + completedEvents.length,
                    },
                });
                updatePromises.push(newOriginStopEvent);

                // rest of waypoints will represent correct sequence by considering completed events and origin waypoint
                // new origin waypoint is represented as a simple waypoint, because origin has already has been defined and completed
                posindex += 1;
            }

            for (const [index, leg] of legs.entries()) {
                // Round to the 3rd decimal place
                const waypointsLatRounded = parseFloat(leg.end_location.lat.toFixed(3));
                const waypointsLngRounded = parseFloat(leg.end_location.lng.toFixed(3));

                // Query for the stop with matching lat and lon coordinates up to 3rd decimal place
                const matchingStop = await this.prismaRepository.stop.findFirst({
                    where: {
                        lat: {
                            gte: waypointsLatRounded - 0.0005,
                            lte: waypointsLatRounded + 0.0005,
                        },
                        lon: {
                            gte: waypointsLngRounded - 0.0005,
                            lte: waypointsLngRounded + 0.0005,
                        },
                    },
                });

                if (matchingStop) {
                    const createUpdatePromise = this.prismaRepository.event.create({
                        data: {
                            id_route: route.id_route,
                            id_stop: matchingStop.id_stop,
                            pos: index + posindex + completedEvents.length,
                            status: EventStatus.PENDING,
                        },
                    });
                    updatePromises.push(createUpdatePromise);
                }
            }
            await this.prismaRepository.$transaction(updatePromises);
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async createEventRecordFromEventTemplate(routeTemplateId: number, routeId: number): Promise<void> {
        try {
            const eventTemplates = await this.prismaRepository.eventTemplate.findMany({
                where: { id_route_template: routeTemplateId },
            });
            if (!eventTemplates) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `EventTemplates with RouteTemplate id ${routeTemplateId} not found in DB `,
                });
            }

            const createEvents = eventTemplates.map((template) => {
                return this.prismaRepository.event.create({
                    data: {
                        id_route: routeId,
                        id_stop: template.id_stop,
                        pos: template.pos,
                        status: EventStatus.PENDING,
                    },
                });
            });

            await this.prismaRepository.$transaction(createEvents);
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }
}
