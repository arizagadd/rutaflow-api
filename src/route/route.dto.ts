import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
        @IsString()
        @IsNotEmpty()
        name: string;

        @IsNumber()
        @IsNotEmpty()
        enterpriseId: number;

        @IsNumber()
        @IsNotEmpty()
        clientId: number;

        @IsNumber()
        @IsNotEmpty()
        driverId: number;

        @IsNumber()
        @IsNotEmpty()
        vehicleId: number;

        @IsNumber()
        @IsNotEmpty()
        @IsOptional()
        routeTemplateId?: number;

        @IsString()
        @IsNotEmpty()
        origin: string;

        @IsString()
        @IsNotEmpty()
        destination: string;

        @IsArray()
        @IsString({ each: true })
        @ArrayMinSize(1)
        waypoints: string[];
}
