import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    //Specific origin urls to allow the request only from them
    const allowedOrigins = ['http://localhost:80', 'https://dev.rutaflow.com', 'https://app.rutaflow.com'];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true); // Allow requests from allowed origins or no origin (like Postman)
            } else {
                callback(new Error('Not allowed by CORS')); // Reject requests from unknown origins
            }
        },
        methods: 'GET,POST,PUT,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true,
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
