import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError } from '../shared/errors/custom-errors';
import { isPrismaError } from '../shared/errors/helper-functions';

@Injectable()
export class DriverRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async create(data: any) {
                return { status: 'ok', data };
        }
        async findDriverById(id: number) {
                try {
                        const driver = await this.prismaRepository.driver.findFirst({
                                where: {
                                        id_driver: id,
                                },
                        });
                        if (!driver) {
                                throw new DataBaseError({
                                        domain: 'DRIVER_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `Driver with id ${id} not found`,
                                });
                        }

                        return driver;
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
