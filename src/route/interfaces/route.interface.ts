import { RouteLeg } from '@googlemaps/google-maps-services-js';

export interface CreateRouteParams {
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
}

export interface UpdateRouteTemplateParams {
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
}

export interface FilteredDirectionsData {
    polyline: string;
    legPolyline: string[];
    legs: RouteLeg[];
    totalDistance: number;
    totalDuration: number;
    totalStops: number;
}
