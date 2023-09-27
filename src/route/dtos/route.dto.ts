import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRouteDto {
    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    routeTemplateId?: number;

    @IsNumber()
    @IsNotEmpty()
    enterpriseId: number;

    @IsNumber()
    @IsNotEmpty()
    clientId: number;

    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    driverId: number;

    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    vehicleId: number;
}

export class RouteResponseDto {}
