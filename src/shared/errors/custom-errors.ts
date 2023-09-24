import { Prisma } from '@prisma/client';
import { ErrorBase } from './base-error';

type Domain = 'USER' | 'ENTERPRISE' | 'DRIVER' | 'VEHICLE' | 'STOP' | 'ROUTE' | 'MAP' | 'DATABASE';

type AppLayer = 'CONTROLLER' | 'SERVICE' | 'REPOSITORY';

// Error Types according to domain
type DataBaseErrorType = 'CREATE_RECORD_ERROR' | 'GET_RECORD_ERROR' | 'UPDATE_RECORD_ERROR' | 'DELETE_RECORD_ERROR' | 'PRISMA_ERROR';
export class DataBaseError extends ErrorBase<Domain, AppLayer, DataBaseErrorType> {}

// type RouteDomainErrorType = 'ROUTE_GENERATION' | 'ROUTE_OPTIMIZATION';
export class RouteDomainError extends ErrorBase<Domain, AppLayer> {}

// Helper functions
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
