import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { number } from 'zod';

export class CreateRouteDto {
    @IsNumber()
    @IsNotEmpty()
    routeTemplateId: number;

    @IsNumber()
    @IsNotEmpty()
    clientId: number;

    @IsNumber()
    @IsNotEmpty()
    driverId: number;

    @IsNumber()
    @IsNotEmpty()
    vehicleId: number;
}
export class UpdateRouteDto {
    @IsNumber()
    @IsNotEmpty()
    routeId: number;

    @IsNumber()
    @IsNotEmpty()
    stopInitial: number;

    @IsNumber()
    @IsNotEmpty()
    stopFinal: number;

    @IsArray() // should be an array
    @ValidateNested({ each: true }) // validate that each item in said nested array is IN FACT of type number
    @Type(() => number) // define which type we are checking for validation
    stopWaypoints: number[];
}
export class RouteResponseDto {}
