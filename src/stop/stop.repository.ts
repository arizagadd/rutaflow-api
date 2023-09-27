import { Injectable } from '@nestjs/common';
import { Stop } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';
import { DataBaseError, UnexpectedError } from '../shared/errors/custom-errors';

@Injectable()
export class StopRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async createStopRecord(data: any) {
                return { status: 'ok', data };
        }

        async findStopRecordById(id: number): Promise<Stop> {
                try {
                        const stop = await this.prismaRepository.stop.findFirst({
                                where: {
                                        id_stop: id,
                                },
                        });
                        if (!stop) {
                                throw new DataBaseError({
                                        domain: 'STOP',
                                        layer: 'REPOSITORY',
                                        type: 'GET_RECORD_ERROR',
                                        message: `findStopRecordById: Stop with id ${id} not found`,
                                });
                        }

                        return stop;
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
