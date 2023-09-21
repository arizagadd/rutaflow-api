import { Injectable } from '@nestjs/common';
import { checklist_event, event, route, route_template } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { RouteData } from './interfaces/route.interface';
@Injectable()

//FIXME: after running introspect with prisma and fixing the fields
// you have to to push to the db of origin in order to reflect the changes
// this could cause a compatibility issue with the CMS
export class RouteRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}

        async createRoute(data: RouteData): Promise<route> {
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
                        console.log(error);
                }
        }

        async findRouteById(id: number): Promise<route> {
                try {
                        return await this.prismaRepository.route.findFirst({
                                where: {
                                        id_route: id,
                                },
                        });
                } catch (err) {
                        console.log(err);
                }
        }

        async findRouteTemplateById(id: number): Promise<route_template> {
                try {
                        return await this.prismaRepository.route_template.findFirst({
                                where: {
                                        id_route_template: id, // 30
                                },
                        });
                } catch (err) {
                        console.log(err);
                }
        }
        async findAllEvents(): Promise<event[]> {
                try {
                        return await this.prismaRepository.event.findMany();
                } catch (e) {
                        console.log(e);
                }
        }

        async findAllChecklistEvents(): Promise<checklist_event[]> {
                try {
                        return await this.prismaRepository.checklist_event.findMany();
                } catch (e) {
                        console.log(e);
                }
        }
        async createChecklistEvent(checklistId: number, routeId: number) {
                return await this.prismaRepository.checklist_event.create({
                        data: {
                                id_checklist: checklistId,
                                id_route: routeId,
                        },
                });
        }
}
