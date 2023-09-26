import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StopController } from './stop.controller';
import { StopRepository } from './stop.repository';
import { StopService } from './stop.service';

@Module({
        imports: [PrismaModule],
        controllers: [StopController],
        providers: [StopService, StopRepository],
        exports: [StopRepository, StopService],
})
export class StopModule {}
