import { Module } from '@nestjs/common';
import { PrismaRepository } from './prisma.repository';
import { PrismaService } from './prisma.service';
import { PrismaController } from './prisma.controller';

@Module({
        providers: [PrismaRepository, PrismaService],
        exports: [PrismaRepository, PrismaService],
        controllers: [PrismaController],
})
export class PrismaModule {}
