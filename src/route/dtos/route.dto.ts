import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRouteDto {
    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    routeTemplateId: number;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    clientId: number;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    driverId: number;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    vehicleId: number;
}
export class RouteResponseDto {}
