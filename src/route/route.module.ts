import { Module } from '@nestjs/common';
import { MapsModule } from '../maps/maps.module';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';

@Module({
        imports: [MapsModule],
        providers: [RouteService],
        controllers: [RouteController],
})
export class RouteModule {}
