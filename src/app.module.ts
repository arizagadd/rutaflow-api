import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DriverModule } from './driver/driver.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { MapsModule } from './maps/maps.module';
import { PrismaModule } from './prisma/prisma.module';
import { RouteModule } from './route/route.module';
import { StopModule } from './stop/stop.module';
import { UserModule } from './user/user.module';
import { VehicleModule } from './vehicle/vehicle.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        PrismaModule,
        UserModule,
        MapsModule,
        VehicleModule,
        DriverModule,
        RouteModule,
        EnterpriseModule,
        StopModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
