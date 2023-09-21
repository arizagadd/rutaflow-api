export interface RouteData {
        enterpriseId: number;
        clientId: number;
        driverId: number;
        vehicleId: number;
        routeTemplateId?: number;
        // origin: string;
        // destination: string;
        // waypoints: string[];
        name: string;
        dateStart: Date;
        dateEnd: Date;
        polyline: string;
        totalDistance: number;
        totalDuration: number;
        stopInitial: number;
        stopFinal: number;
}
