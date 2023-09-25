import { Injectable } from '@nestjs/common';
import { Route, RouteTemplate } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';
import { RouteData } from './interfaces/route.interface';

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
}
