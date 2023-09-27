import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '../prisma/prisma.repository';
import { UserData } from './user.interface';

@Injectable()
export class UserRepository {
    constructor(private readonly prismaRepository: PrismaRepository) {}
    async createUserRecord(data: UserData) {
        const result = await this.prismaRepository.user.create({
            data: {
                name: data.name,
                email: data.name,
                pass: data.pass,
            },
        });

        return result;
    }
}
