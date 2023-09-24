import { Injectable } from '@nestjs/common';
import { Checklist, Client, Enterprise } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, isPrismaError } from '../shared/errors/custom-errors';

@Injectable()
export class EnterpriseRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async createEnterprise(data: any) {
                return { status: 'ok', data };
        }
        async findEnterpriseById(id: number): Promise<Enterprise> {
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
                                        message: `findEnterpriseById: Enterprise with id ${id} not found`,
                                });
                        }

                        return enterprise;
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
                }
        }
        async findClientById(id: number): Promise<Client> {
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
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE',
                                        layer: 'REPOSITORY',
                                        type: 'PRISMA_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }

                        throw error; // re-throw unexpected errors
                }
        }
        async createChecklist(clientId: number): Promise<Checklist> {
                try {
                        return await this.prismaRepository.checklist.create({
                                data: {
                                        id_client: clientId,
                                },
                        });
                } catch (error) {
                        if (isPrismaError(error)) {
                                throw new DataBaseError({
                                        domain: 'DATABASE',
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
