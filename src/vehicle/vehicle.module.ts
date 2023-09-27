import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VehicleRepository } from './vehicle.repository';
import { VehicleService } from './vehicle.service';

@Module({
    imports: [PrismaModule],
    providers: [VehicleService, VehicleRepository],
    exports: [VehicleService, VehicleRepository],
})
export class VehicleModule {}
