import { Module } from '@nestjs/common';
import { PrismaController } from './prisma.controller';
import { PrismaRepository } from './prisma.repository';
import { PrismaService } from './prisma.service';

@Module({
    providers: [PrismaRepository, PrismaService],
    exports: [PrismaRepository, PrismaService],
    controllers: [PrismaController],
})
export class PrismaModule {}
