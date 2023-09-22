import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '../prisma/prisma.repository';

@Injectable()
export class DriverRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async create(data: any) {
                return { status: 'ok', data };
        }
        async findDriverById(id: number) {
                return await this.prismaRepository.driver.findFirst({
                        where: {
                                id_driver: id,
                        },
                });
        }
}
