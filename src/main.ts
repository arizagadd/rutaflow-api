import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    //Specific origin urls to allow the request only from them
    const allowedOrigins = [
        'https://app.rutaflow.com',
        'https://dev.rutaflow.com',
        'https://driver.rutaflow.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8001',
        'http://127.0.0.1:8001',
        'https://localhost',
        'capacitor://localhost',
        'ionic://localhost',
    ];

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

    // Enable versioning, and configure the type and header if needed
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // Set global route prefix
    app.setGlobalPrefix('api');

    await app.listen(process.env.PORT, '0.0.0.0');
}
bootstrap();
