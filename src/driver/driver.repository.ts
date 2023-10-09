import { Injectable } from '@nestjs/common';
import { Driver } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';

@Injectable()
export class DriverRepository {
    constructor(private readonly prismaRepository: PrismaRepository) {}
    // async createDriverRecord(data: any) {
    //     return { status: 'ok', data };
    // }
    async findDriverRecordById(id: number): Promise<Driver> {
        try {
            const driver = await this.prismaRepository.driver.findFirst({
                where: {
                    id_driver: id,
                },
            });
            if (!driver) {
                throw new DataBaseError({
                    domain: 'DRIVER',
                    layer: 'REPOSITORY',
                    type: 'GET_RECORD_ERROR',
                    message: `Driver with id ${id} not found`,
                });
            }

            return driver;
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            } else {
                throw new UnexpectedError({
                    domain: 'DRIVER',
                    layer: 'REPOSITORY',
                    type: 'UNEXPECTED_ERROR',
                    message: `Error:${error.message}`,
                    cause: error,
                });
            }
        }
    }
}
