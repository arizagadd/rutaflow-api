import { Injectable } from '@nestjs/common';
import { Checklist, Client, Enterprise } from '@prisma/client';
import { PrismaRepository } from '../prisma/prisma.repository';

@Injectable()
export class EnterpriseRepository {
        constructor(private readonly prismaRepository: PrismaRepository) {}
        async createEnterprise(data: any) {
                return { status: 'ok', data };
        }
        async findEnterpriseById(id: number): Promise<Enterprise> {
                return await this.prismaRepository.enterprise.findFirst({
                        where: {
                                id_enterprise: id, // 2
                        },
                });
        }
        async findClientById(id: number): Promise<Client> {
                return await this.prismaRepository.client.findFirst({
                        where: {
                                id_client: id, // 2
                        },
                });
        }
        async createChecklist(clientId: number): Promise<Checklist> {
                return await this.prismaRepository.checklist.create({
                        data: {
                                id_client: clientId,
                        },
                });
        }
}
