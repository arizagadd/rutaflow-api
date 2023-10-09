import { Injectable } from '@nestjs/common';
import { Checklist, ChecklistEvent, Client, Enterprise, Event } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';

@Injectable()
export class EnterpriseRepository {
    constructor(private readonly prismaRepository: PrismaRepository) {}
    // async createEnterpriseRecord(data: any) {
    //     return { status: 'ok', data };
    // }

    async findEnterpriseRecordById(id: number): Promise<Enterprise> {
        try {
            const enterprise = await this.prismaRepository.enterprise.findFirst({
                where: {
                    id_enterprise: id,
                },
            });

            if (!enterprise) {
                throw new DataBaseError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Enterprise with id ${id} not found`,
                });
            }

            return enterprise;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error; // Throw the specific database error.
            } else {
                throw new UnexpectedError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async findClientRecordById(id: number): Promise<Client> {
        try {
            const client = await this.prismaRepository.client.findFirst({
                where: {
                    id_client: id,
                },
            });

            if (!client) {
                throw new DataBaseError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Client with id ${id} not found`,
                });
            }

            return client;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async createChecklistRecord(clientId: number): Promise<Checklist> {
        try {
            const checklist = await this.prismaRepository.checklist.create({
                data: {
                    id_client: clientId,
                },
            });

            if (!checklist) {
                throw new DataBaseError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'CREATE_RECORD_ERROR',
                    message: `Unable to create checklist`,
                });
            }

            return checklist;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }

    async fetchAllEventRecords(): Promise<Event[]> {
        try {
            return await this.prismaRepository.event.findMany();
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ENTERPRISE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async fetchAllChecklistEventRecords(): Promise<ChecklistEvent[]> {
        try {
            return await this.prismaRepository.checklistEvent.findMany();
        } catch (error) {
            throw new UnexpectedError({
                domain: 'ENTERPRISE',
                layer: 'REPOSITORY',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async createChecklistEventRecord(checklistId: number, routeId: number): Promise<void> {
        try {
            const checklistEvent = await this.prismaRepository.checklistEvent.create({
                data: {
                    id_checklist: checklistId,
                    id_route: routeId,
                },
            });
            if (!checklistEvent) {
                throw new DataBaseError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'CREATE_RECORD_ERROR',
                    message: 'Unable to create route',
                });
            }
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'ENTERPRISE',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }
}
