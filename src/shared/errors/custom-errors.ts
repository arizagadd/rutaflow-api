import { ErrorBase } from './base-error';

type AppLayer = 'CONTROLLER' | 'SERVICE' | 'REPOSITORY';

type Domain = 'USER' | 'ENTERPRISE' | 'DRIVER' | 'VEHICLE' | 'STOP' | 'ROUTE' | 'MAP' | 'DATABASE' | 'PRISMA';
export class DomainError extends ErrorBase<Domain, AppLayer> {}

type UnexpectedErrorType = 'UNEXPECTED_ERROR';
export class UnexpectedError extends ErrorBase<Domain, AppLayer, UnexpectedErrorType> {}

type DataBaseErrorType = 'CREATE_RECORD_ERROR' | 'GET_RECORD_ERROR' | 'UPDATE_RECORD_ERROR' | 'DELETE_RECORD_ERROR' | 'PRISMA_ERROR';
export class DataBaseError extends ErrorBase<Domain, AppLayer, DataBaseErrorType> {}
