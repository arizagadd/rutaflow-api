import { Prisma } from '@prisma/client';
import { ErrorBase } from './base-error';

type DomainType =
        | 'USER_DOMAIN'
        | 'ENTERPRISE_DOMAIN'
        | 'DRIVER_DOMAIN'
        | 'VEHICLE_DOMAIN'
        | 'STOP_DOMAIN'
        | 'ROUTE_DOMAIN'
        | 'MAP_DOMAIN'
        | 'DATABASE_DOMAIN';

type ApplicationLayer = 'CONTROLLER' | 'SERVICE' | 'REPOSITORY';

// Error Types according to domain
type DataBaseErrorType = 'CREATE_RECORD_ERROR' | 'GET_RECORD_ERROR' | 'UPDATE_RECORD_ERROR' | 'DELETE_RECORD_ERROR' | 'PRISMA_ERROR';
export class DataBaseError extends ErrorBase<DomainType, ApplicationLayer, DataBaseErrorType> {}

type RouteDomainErrorType = 'ROUTE_ERROR' | 'EVENT_ERROR' | 'EVIDENCE_ERROR' | 'ROUTE_TEMPLATE_ERROR' | 'EVENT_ERROR';
export class RouteDomainError extends ErrorBase<DomainType, ApplicationLayer, RouteDomainErrorType> {}

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
