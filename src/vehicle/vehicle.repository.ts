import { Injectable } from '@nestjs/common';
import { Vehicle } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';

@Injectable()
export class VehicleRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async create(data: any) {
                return { status: 'ok', data };
        }
        async findVehicleById(id: number): Promise<Vehicle> {
                return await this.prismaRepository.vehicle.findFirst({
                        where: {
                                id_vehicle: id, // 2
                        },
                });
        }
}
