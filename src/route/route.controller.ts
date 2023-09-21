import { Body, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { ErrorResponse, SuccessResponse } from '../shared/response.dto';
import { CreateRouteDto } from './route.dto';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
        constructor(private readonly routeService: RouteService) {}

        @Post('generate')
        async generate(@Body() data: CreateRouteDto): Promise<SuccessResponse<string> | ErrorResponse> {
                const newRoute = await this.routeService.generateRoute(data);
                const route = this.routeService.findRouteById(newRoute.id_route);
                if (!route) {
                        throw new InternalServerErrorException({
                                status: 'error',
                                error: {
                                        code: 500,
                                        message: 'Route could not be created.',
                                },
                        });
                }
                return {
                        status: 'success',
                        message: 'Route created successfully.',
                };
        }
}
