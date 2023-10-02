import { RouteLeg } from '@googlemaps/google-maps-services-js';
import { Route, Stop } from '@prisma/client';
import { DirectionsRequestParams } from '../../maps/maps.type';

export type CreateRouteParams = {
    enterpriseId: number;
    clientId: number;
    driverId: number;
    vehicleId: number;
    routeTemplateId?: number;
    name: string;
    dateStart: Date;
    dateEnd: Date;
    polyline: string;
    totalDistance: number;
    totalDuration: number;
    totalStops: number;
    stopInitial: number;
    stopFinal: number;
};

export type UpdateRouteTemplateParams = {
    enterpriseId?: number;
    driverId?: number;
    name?: string;
    polyline?: string;
    description?: string;
    color?: string;
    symbol?: string;
    totalDuration?: number;
    totalDistance?: number;
    totalStops?: number;
    stopInitial?: number;
    stopFinal?: number;
    tag?: string;
};

export type FilteredDirectionsData = {
    polyline: string;
    legPolyline: string[];
    legs: RouteLeg[];
    totalDistance: number;
    totalDuration: number;
    totalStops: number;
};
export type UpdateRouteParams = {
    enterpriseId?: number;
    clientId?: number;
    driverId?: number;
    vehicleId?: number;
    routeTemplateId?: number;
    name?: string;
    dateStart?: Date;
    dateEnd?: Date;
    polyline?: string;
    totalDistance?: number;
    totalDuration?: number;
    totalStops?: number;
    stopInitial?: number;
    stopFinal?: number;
};

export type SetRouteTemplateDirectionsParams = {
    routeTemplateId: number;
    directions: DirectionsRequestParams;
};

export type SetupRouteDirectionsParams = {
    stopInitial: Stop;
    stopFinal: Stop;
    stopWaypoints?: Stop[];
};

export type UpdateRouteDirectionsParams = {
    route: Route;
    newStopInitial: Stop;
    newStopFinal: Stop;
    newDirections: DirectionsRequestParams;
};
