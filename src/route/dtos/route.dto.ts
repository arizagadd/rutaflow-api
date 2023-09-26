import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
        @IsString()
        // @IsNotEmpty()
        @IsOptional()
        name: string;

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

        @IsNumber()
        @IsNotEmpty()
        @IsOptional()
        routeTemplateId?: number;

        @IsOptional()
        @IsString()
        @IsNotEmpty()
        origin: string;

        @IsOptional()
        @IsString()
        @IsNotEmpty()
        destination: string;

        @IsOptional()
        @IsArray()
        @IsString({ each: true })
        @ArrayMinSize(1)
        waypoints: string[];
}

export class RouteResponseDto {}
