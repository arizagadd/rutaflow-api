import { Body, Controller, Post } from '@nestjs/common';
import { CreateRouteDto } from './route.dto';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
        constructor(private readonly routeService: RouteService) {}

        @Post('generate')
        async generate(@Body() data: CreateRouteDto) {
                return this.routeService.generateRoute(data);
        }
}
