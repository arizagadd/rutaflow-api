import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

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
export class UpdateRouteDto {
    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    routeId: number;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    stopInitial: number;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    stopFinal: number;

    @IsArray()
    @Transform(({ value }) => value.toString().split(',').map(Number))
    stopWaypoints: number[];
}
export class RouteResponseDto {}
