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
        stopInitial: number;
        stopFinal: number;
}

export interface PopulateRouteTemplateData {
        // enterpriseId: number;
        // driverId?: number;
        // name?: string;
        polyline?: string;
        totalDuration?: number;
        totalDistance?: number;
        // description?: string;
        // color?: string;
        // symbol?: string;
        totalStops?: number;
        // stopInitial?: number; // already provided in request at controller level
        // stopFinal?: number; // already provided in request at controller level
        // tag?: string;

        // the commented out data can de done from the CMS
}
