import { Body, Controller, InternalServerErrorException, Post, Req } from '@nestjs/common';
import { ErrorResponse, SuccessResponse } from '../shared/json-response.dto';
import { logError } from '../shared/logger';
import { CreateRouteDto } from './dtos/route.dto';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
    constructor(private readonly routeService: RouteService) {}

    // @Post('generate')
    // async generate(@Req() req: Request, @Body() data: CreateRouteDto): Promise<SuccessResponse<string> | ErrorResponse> {
    //         try {
    //                 const newRoute = await this.routeService.generateRoute(data);
    //                 await this.routeService.getRoute(newRoute.id_route);
    //         } catch (error) {
    //                 logError(error, req);
    //                 throw new InternalServerErrorException({
    //                         status: 'error',
    //                         error: {
    //                                 code: 500,
    //                                 message: 'Route could not be created.',
    //                         },
    //                 });
    //         }

    //         return {
    //                 status: 'success',
    //                 message: 'Route created successfully.',
    //         };
    // }

    @Post('generate/from-template')
    async generateFromTemplate(@Req() req: Request, @Body() data: CreateRouteDto): Promise<SuccessResponse<string> | ErrorResponse> {
        try {
            const newRoute = await this.routeService.generateRoute(data);
            await this.routeService.getRoute(newRoute.id_route);
        } catch (error) {
            logError(error, req);
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
