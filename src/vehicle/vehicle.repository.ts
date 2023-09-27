import { Injectable } from '@nestjs/common';
import { Vehicle } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';

@Injectable()
export class VehicleRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async createVehicleRecord(data: any) {
                return { status: 'ok', data };
        }

        async findVehicleRecordById(id: number): Promise<Vehicle> {
                try {
                        const vehicle = await this.prismaRepository.vehicle.findFirst({
                                where: {
                                        id_vehicle: id,
                                },
                        });
                        if (!vehicle) {
                                throw new DataBaseError({
                                        domain: 'VEHICLE',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `findVehicleById: Vehicle with id ${id} not found`,
                                });
                        }

                        return vehicle;
                } catch (error) {
                        if (error instanceof DataBaseError) {
                                throw error;
                        } else {
                                throw new UnexpectedError({
                                        domain: 'VEHICLE',
                                        layer: 'REPOSITORY',
                                        type: 'UNEXPECTED_ERROR',
                                        message: error.message,
                                        cause: error,
                                });
                        }
                }
        }
}
