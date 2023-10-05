import { Body, Controller, InternalServerErrorException, Post, Req, Version } from '@nestjs/common';
import { ErrorResponse, SuccessResponse } from '../shared/json-response.dto';
import { logError } from '../shared/logger';
import { CreateRouteByTemplateDto, UpdateRouteDto } from './dtos/route.dto';
import { RouteService } from './route.service';

@Controller('route')
export class RouteController {
    constructor(private readonly routeService: RouteService) {}

    @Version('1')
    @Post('generate/from-template')
    async generateFromTemplate(
        @Req() req: Request,
        @Body() data: CreateRouteByTemplateDto,
    ): Promise<SuccessResponse<string> | ErrorResponse> {
        try {
            const newRoute = await this.routeService.generateRouteFromTemplate(data);
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
    @Version('1')
    @Post('update-trajectory')
    async generate(@Req() req: Request, @Body() data: UpdateRouteDto): Promise<SuccessResponse<string> | ErrorResponse> {
        try {
            const updatedRoute = await this.routeService.updateRouteTrajectory(data);
            await this.routeService.getRoute(updatedRoute.id_route);
        } catch (error) {
            logError(error, req);
            throw new InternalServerErrorException({
                status: 'error',
                error: {
                    code: 500,
                    message: 'Route could not be updated.',
                },
            });
        }

        return {
            status: 'success',
            message: 'Route updated successfully.',
        };
    }
}
