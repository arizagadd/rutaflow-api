import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverRepository } from './driver.repository';
import { DriverService } from './driver.service';

@Module({
        imports: [PrismaModule],
        providers: [DriverService, DriverRepository],
        exports: [DriverService, DriverRepository],
})
export class DriverModule {}
