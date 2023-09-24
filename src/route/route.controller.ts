import { Body, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { RouteDomainError } from '../shared/errors/custom-errors';
import { logErrorInJSONFormat } from '../shared/errors/helper-functions';
import { ErrorResponse, SuccessResponse } from '../shared/json-response.dto';
import { CreateRouteDto } from './dtos/route.dto';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
        constructor(private readonly routeService: RouteService) {}

        @Post('generate')
        async generate(@Body() data: CreateRouteDto): Promise<SuccessResponse<string> | ErrorResponse> {
                try {
                        const newRoute = await this.routeService.generateRoute(data);
                        await this.routeService.findRouteById(newRoute.id_route);
                } catch (error) {
                        if (error instanceof RouteDomainError) {
                                logErrorInJSONFormat(error);

                                throw new InternalServerErrorException({
                                        status: 'error',
                                        error: {
                                                code: 500,
                                                message: 'Route could not be created.',
                                        },
                                });
                        }
                }

                return {
                        status: 'success',
                        message: 'Route created successfully.',
                };
        }
}
