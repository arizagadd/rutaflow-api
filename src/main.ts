import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    // Enable CORS with specific configuration
    app.enableCors({
        origin: 'https://rutaflow-api-development.up.railway.app', // Replace with your frontend’s URL
        methods: 'GET,POST,PUT,DELETE', // Specify allowed methods
        allowedHeaders: 'Content-Type,Authorization', // Specify allowed headers
        credentials: true, // Include if you need to send cookies or auth headers
    });

    // Global ValidationPipe for request validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Enable URI versioning
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // Set global route prefix
    app.setGlobalPrefix('api');

    await app.listen(process.env.PORT, '0.0.0.0');
}
bootstrap();
