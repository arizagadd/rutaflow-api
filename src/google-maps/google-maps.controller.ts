import { Body, Controller, Post } from '@nestjs/common';
import { GoogleMapsService } from './google-maps.service';

@Controller('maps')
export class GoogleMapsController {
        constructor(private readonly googleMapsService: GoogleMapsService) {}
        @Post('generate-route')
        async generate(@Body() data: any) {
                return this.googleMapsService.generateRoute(data);
        }
}
