import { Module } from '@nestjs/common';
import { DriverModule } from '../driver/driver.module';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { MapsModule } from '../maps/maps.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { RouteController } from './route.controller';
import { RouteRepository } from './route.repository';
import { RouteService } from './route.service';

@Module({
        imports: [MapsModule, PrismaModule, EnterpriseModule, VehicleModule, DriverModule],
        providers: [RouteService, RouteRepository],
        controllers: [RouteController],
})
export class RouteModule {}
