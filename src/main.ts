import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );
    // Enable versioning, and configure the type and header if needed
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // Set global route prefix
    app.setGlobalPrefix('api');

    await app.listen(process.env.PORT,'0.0.0.0');
}
bootstrap();
