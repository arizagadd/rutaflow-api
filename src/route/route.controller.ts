import { Body, Controller, Post } from '@nestjs/common';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
        constructor(private readonly routeService: RouteService) {}

        @Post('generate')
        async generate(@Body() data: any) {
                return this.routeService.generateRoute(data);
        }
}
