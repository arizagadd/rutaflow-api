import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { GoogleMapsModule } from './google-maps/google-maps.module';

@Module({
        imports: [
                ConfigModule.forRoot({
                        envFilePath: '.env',
                }),
                PrismaModule,
                UserModule,
                GoogleMapsModule,
        ],
        controllers: [AppController],
        providers: [AppService],
})
export class AppModule {}
