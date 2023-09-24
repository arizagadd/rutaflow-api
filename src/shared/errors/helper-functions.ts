import { Prisma } from '@prisma/client';
import { ErrorBase } from './base-error';
import { RouteDomainError } from './custom-errors';

export function isPrismaError(
        error: any,
): error is
        | Prisma.PrismaClientKnownRequestError
        | Prisma.PrismaClientUnknownRequestError
        | Prisma.PrismaClientValidationError
        | Prisma.PrismaClientInitializationError
        | Prisma.PrismaClientRustPanicError {
        return (
                error instanceof Prisma.PrismaClientKnownRequestError ||
                error instanceof Prisma.PrismaClientUnknownRequestError ||
                error instanceof Prisma.PrismaClientValidationError ||
                error instanceof Prisma.PrismaClientInitializationError ||
                error instanceof Prisma.PrismaClientRustPanicError
        );
}

// Helper function to extract error details
function extractErrorDetails(error: ErrorBase<string, string, string>) {
        return {
                ERROR: {
                        domain: error.domain,
                        layer: error.layer,
                        type: error.type,
                        message: error.message,
                        cause: error.cause instanceof ErrorBase ? extractErrorDetails(error.cause) : error.cause?.message,
                },
        };
}

// Function to log the error in a pretty-printed JSON format
export function logErrorInJSONFormat(error: RouteDomainError) {
        const errorDetails = extractErrorDetails(error);
        console.error(JSON.stringify(errorDetails, null, 2));
}
