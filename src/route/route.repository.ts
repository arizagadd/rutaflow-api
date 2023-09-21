import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '../prisma/prisma.repository';
@Injectable()

//FIXME: after running introspect with prisma and fixing the fields
// you have to to push to the db of origin in order to reflect the changes
// this could cause a compatibility issue with the CMS
export class RouteRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}

        async createRoute(data: any) {
                try {
                        // // hacer query a bd para obtener entidad
                        // const enterprise = await this.prismaRepository.enterprise.findFirst({
                        //         where: {
                        //                 id_enterprise: 2,
                        //         },
                        // });
                        // const client = await this.prismaRepository.client.findFirst({
                        //         where: {
                        //                 id_client: 2,
                        //         },
                        // });

                        // const vehicle = await this.prismaRepository.vehicle.findFirst({
                        //         where: {
                        //                 id_vehicle: 2,
                        //         },
                        // });

                        // const driver = await this.prismaRepository.driver.findFirst({
                        //         where: {
                        //                 id_driver: 2,
                        //         },
                        // });

                        // const routeTemplate = await this.prismaRepository.route_template.findFirst({
                        //         where: {
                        //                 id_route_template: 30,
                        //         },
                        // });

                        // const checklistEvent = this.prismaRepository.checklist_event.findMany();

                        const result = await this.prismaRepository.route.create({
                                data: {
                                        id_enterprise: data.id_enterprise,
                                        id_client: data.id_client,
                                        id_vehicle: data.id_vehicle,
                                        id_driver: data.id_driver,
                                        id_route_template: data.id_route_template,
                                        name: 'Test Route 1',
                                        date_start: new Date(),
                                        date_end: new Date(),
                                        polyline: data.polyline,
                                        total_duration: data.totalDuration,
                                        total_distance: data.totalDistance,
                                        stop_initial: 0,
                                        stop_final: 4,
                                        // checklist_event[] TODO: set these up later
                                        //event[]
                                },
                        });
                        console.log(result);
                } catch (error) {
                        console.log(error);
                }

                return { status: 'ok' };
        }

        async findRouteTemplateById(id: number) {
                return await this.prismaRepository.route_template.findFirst({
                        where: {
                                id_route_template: id, // 30
                        },
                });
        }
}
