import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRouteDto {
    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    routeTemplateId: number;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    clientId: number;

    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    driverId: number;

    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    vehicleId: number;
}
export class RouteResponseDto {}
