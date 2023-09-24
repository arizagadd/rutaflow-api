import { Injectable } from '@nestjs/common';
import { Vehicle } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError } from '../shared/errors/custom-errors';
import { isPrismaError } from '../shared/errors/helper-functions';

@Injectable()
export class VehicleRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async create(data: any) {
                return { status: 'ok', data };
        }

        async findVehicleById(id: number): Promise<Vehicle> {
                try {
                        const vehicle = await this.prismaRepository.vehicle.findFirst({
                                where: {
                                        id_vehicle: id,
                                },
                        });
                        if (!vehicle) {
                                throw new DataBaseError({
                                        domain: 'VEHICLE_DOMAIN',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `Vehicle with id ${id} not found`,
                                });
                        }

                        return vehicle;
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
