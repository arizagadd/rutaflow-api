export interface RouteData {
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
