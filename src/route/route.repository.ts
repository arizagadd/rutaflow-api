import { Injectable } from '@nestjs/common';
import { ChecklistEvent, Event, Route, RouteTemplate } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError } from '../shared/errors/custom-errors';
import { isPrismaError } from '../shared/errors/helper-functions';
import { RouteData } from './interfaces/route.interface';

@Injectable()
export class RouteRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}

        async createRoute(data: RouteData): Promise<Route> {
                try {
                        return await this.prismaRepository.route.create({
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
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                        throw error; // re-throw unexpected errors
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
                                        domain: 'ROUTE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `Route with id ${id} not found`,
                                });
                        }

                        return route;
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
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
                                        domain: 'ROUTE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `RouteTemplate with id ${id} not found`,
                                });
                        }

                        return routeTemplate;
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
                }
        }

        async findAllEvents(): Promise<Event[]> {
                try {
                        return await this.prismaRepository.event.findMany();
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
                }
        }
        // TODO: Move these to enterprise module
        async findAllChecklistEvents(): Promise<ChecklistEvent[]> {
                try {
                        return await this.prismaRepository.checklistEvent.findMany();
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
                }
        }

        async createChecklistEvent(checklistId: number, routeId: number) {
                try {
                        return await this.prismaRepository.checklistEvent.create({
                                data: {
                                        id_checklist: checklistId,
                                        id_route: routeId,
                                },
                        });
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
                }
        }
}
