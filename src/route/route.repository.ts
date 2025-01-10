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
            // Round origin and destination coordinates to the 6th decimal place
            /*const originLatRounded = parseFloat(legs[0].start_location.lat.toFixed(6));
            const originLngRounded = parseFloat(legs[0].start_location.lng.toFixed(6));
            
            const endLatRounded = parseFloat(legs[legs.length - 1].end_location.lat.toFixed(6));
            const endLngRounded = parseFloat(legs[legs.length - 1].end_location.lng.toFixed(6));*/
    
            // Set up origin as pos 0
            /*const originStop = await this.prismaRepository.stop.findFirst({
                where: {
                    lat: { gte: originLatRounded - 0.0005, lte: originLatRounded + 0.0005 },
                    lon: { gte: originLngRounded - 0.0005, lte: originLngRounded + 0.0005 },
                },
            });
            
            if (!originStop) {
                throw new DataBaseError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Stop with lat ${originLatRounded} and lng ${originLngRounded} not found in DB`,
                });
            }
    
            const correspondingOriginEventTemplate = await this.prismaRepository.eventTemplate.findFirst({
                where: {
                    id_stop: originStop.id_stop,
                    id_route_template: routeTemplateId,
                },
            });
            
            if (correspondingOriginEventTemplate) {
                const updateOriginEventTemplatePos = this.prismaRepository.eventTemplate.update({
                    where: { id_event_template: correspondingOriginEventTemplate.id_event_template },
                    data: { pos: 0 },
                });
                updatePromises.push(updateOriginEventTemplatePos);
            }*/
    
            const usedStops = new Set<number>();
            // IMPORTANT: Its possible that the google maps api could return lat and lng values with decimal point precision that
            // don't completely match the level of precision that the user has input into the DB for each stop or vice versa (i.e 23.8999 vs 23.899954).
            // Therefore in order to avoid any type of inconsistencies we round both the lat, lng values from each stop in the DB
            // and the lat, lng values from each waypoint given by google to the 3rd decimal place in order to find a match if there is any
            // Otherwise no match will be found since 23.8999 and 23.899954 are not the same value
            // Process each leg
            for (const [index, leg] of legs.entries()) {
                // Round to the 6th decimal place
                const waypointsLatRounded = parseFloat(leg.end_location.lat.toFixed(6));
                const waypointsLngRounded = parseFloat(leg.end_location.lng.toFixed(6));
            
                try {
                    // Query for all stops with matching lat and lon coordinates
                    const matchingStops = await this.prismaRepository.stop.findMany({
                        where: {
                            lat: { gte: waypointsLatRounded - 0.001, lte: waypointsLatRounded + 0.001 },
                            lon: { gte: waypointsLngRounded - 0.001, lte: waypointsLngRounded + 0.001 },
                            //id_stop: { not: originStop.id_stop }, // Exclude origin stop
                        },
                    });
            
                    let stopUpdated = false;
            
                    for (const stop of matchingStops) {
                        if (!usedStops.has(stop.id_stop)) {
                            const correspondingEventTemplate = await this.prismaRepository.eventTemplate.findFirst({
                                where: {
                                    id_stop: stop.id_stop,
                                    id_route_template: routeTemplateId,
                                },
                            });
            
                            if (correspondingEventTemplate) {
                                const updatePromise = this.prismaRepository.eventTemplate.update({
                                    where: { id_event_template: correspondingEventTemplate.id_event_template },
                                    data: { pos: index },
                                });
                                updatePromises.push(updatePromise);
                                usedStops.add(stop.id_stop); // Mark this stop as used
                                stopUpdated = true;
                                break; // Exit the loop once a stop is updated
                            } else {
                                console.log(`No corresponding event template found for stop ${stop.id_stop}`);
                            }
                        } else {
                            console.log(`Stop ${stop.id_stop} already updated for waypoint ${index + 1}`);
                        }
                    }
            
                    if (!stopUpdated) {
                        console.log(`No matching stop found for waypoint ${index + 1}`);
                    }
                } catch (error) {
                    console.error(`Error processing waypoint ${index + 1}:`, error);
                }
            }
            
    
            // Reassign destination explicitly with the last position, even if it's the same as the origin
            /*const destinationStop = await this.prismaRepository.stop.findFirst({
                where: {
                    lat: { gte: endLatRounded - 0.0005, lte: endLatRounded + 0.0005 },
                    lon: { gte: endLngRounded - 0.0005, lte: endLngRounded + 0.0005 },
                },
            });
            
            if (destinationStop) {
                const correspondingDestinationEventTemplate = await this.prismaRepository.eventTemplate.findFirst({
                    where: {
                        id_stop: destinationStop.id_stop,
                        id_route_template: routeTemplateId,
                        id_event_template: {
                            not: correspondingOriginEventTemplate.id_event_template, // Use 'not' for inequality
                        },
                    },
                });
                
                if (correspondingDestinationEventTemplate) {
                    const updateDestinationEventTemplatePos = this.prismaRepository.eventTemplate.update({
                        where: { id_event_template: correspondingDestinationEventTemplate.id_event_template },
                        data: { pos: legs.length },
                    });
                    updatePromises.push(updateDestinationEventTemplatePos);
                }
            }*/
            // Execute all update promises in a single transaction
            try {
                await this.prismaRepository.$transaction(updatePromises);
            } catch (error) {
                console.error('Error executing update promises:', error);
            }
    
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ROUTE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error: ${error.message}`,
                    cause: error,
                });
            }
        }
    }
    
    

    async updateRouteRecord(routeId: number, data: UpdateRouteParams): Promise<Route> {
        try {
            let stopInitial: number;

            // check if current initial stop has been completed before overwriting
            /*const event = await this.prismaRepository.event.findFirst({
                where: {
                    id_route: routeId,
                    pos: 0,
                },
                select: {
                    status: true,
                    stop: true,
                },
            });*/

            /*if (event.status === EventStatus.COMPLETED) {
                stopInitial = event.stop.id_stop;
            } else {
                stopInitial = data.stopInitial;
            }*/

            stopInitial = data.stopInitial;

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

    async matchLegsToManyEventRecords(route: Route, params: DirectionsResponse, stopWaypoints: number[]): Promise<void> {
        let posindex = 0; // Initial position index
        const updatePromises = []; // Array to store update promises for transaction
        const legs = params.data.routes[0].legs;
    
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
            
            // Filter and store completed events' stop IDs
            const completedEventIds = new Set(events.filter((e) => e.status === EventStatus.COMPLETED).map(e => e.stop.id_stop));
            
            await this.prismaRepository.event.deleteMany({
                where: {
                    id_route: route.id_route,
                    status: {
                        not: EventStatus.COMPLETED,
                    },
                },
            });
    
            const stopIdsSet = new Set<number>(stopWaypoints);
            let currentPos = posindex + completedEventIds.size;
    
            for (const leg of legs) {
                // Round to the 6th decimal place
                const waypointsLatRounded = parseFloat(leg.end_location.lat.toFixed(6));
                const waypointsLngRounded = parseFloat(leg.end_location.lng.toFixed(6));

                // Query for the stops with matching lat and lon coordinates up to 6th decimal place
                const matchingStops = await this.prismaRepository.stop.findMany({
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
    
                for (const stop of matchingStops) {
                    if (stopIdsSet.has(stop.id_stop) && !completedEventIds.has(stop.id_stop)) {
                        stopIdsSet.delete(stop.id_stop);
                        const createUpdatePromise = this.prismaRepository.event.create({
                            data: {
                                id_route: route.id_route,
                                id_stop: stop.id_stop,
                                pos: currentPos,
                                status: EventStatus.PENDING,
                            },
                        });
                        updatePromises.push(createUpdatePromise);
                        currentPos++;
                    }
                }
            }
    
            await this.prismaRepository.$transaction(updatePromises);
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `Error: ${error.message}`,
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
            
            //await Promise.all(updateEvents);
            

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
