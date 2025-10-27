import { Injectable } from '@nestjs/common';
import { EventStatus, Route, RouteTemplate } from '@prisma/client';
import { DriverRepository } from '../driver/driver.repository';
import { EnterpriseRepository } from '../enterprise/enterprise.repository';
import { MapsService } from '../maps/maps.service';
import { DataBaseError, DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { StopRepository } from '../stop/stop.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { CreateRouteByTemplateDto, UpdateRouteDto } from './dtos/route.dto';
import { RouteRepository } from './route.repository';
import {
    CreateRouteParams,
    SetRouteTemplateDirectionsParams,
    SetupRouteDirectionsParams,
    UpdateRouteDirectionsParams,
    UpdateRouteParams,
    UpdateRouteTemplateParams,
} from './types/route.type';

@Injectable()
export class RouteService {
    constructor(
        private readonly mapsService: MapsService,
        private readonly routeRepository: RouteRepository,
        private readonly enterpriseRepository: EnterpriseRepository,
        private readonly vehicleRepository: VehicleRepository,
        private readonly driverRepository: DriverRepository,
        private readonly stopRepository: StopRepository,
    ) { }

    //TODO: update pos 0 event of specific route to 'completed' once driver has started journey

    // Generates directions for a route template without creating a route
    async generateTemplateDirections(body: { routeTemplateId: number }): Promise<RouteTemplate> {
        // Get the route template
        let routeTemplate = await this.routeRepository.findRouteTemplateRecordById(body.routeTemplateId);

        // If there is no polyline, generate directions and update the template
        if (!routeTemplate.polyline) {
            try {
                const stopInitial = await this.stopRepository.findStopRecordById(routeTemplate.stop_initial);
                const stopFinal = await this.stopRepository.findStopRecordById(routeTemplate.stop_final);
                const directions = await this.routeRepository.prepareRouteTemplateDirections(
                    routeTemplate.id_route_template,
                    stopInitial,
                    stopFinal,
                );

                const routeTemplateData: SetRouteTemplateDirectionsParams = {
                    routeTemplateId: routeTemplate.id_route_template,
                    directions,
                };
                // Update the template with the generated directions
                routeTemplate = await this.setRouteTemplateDirections(routeTemplateData);
            } catch (error) {
                // Pass through specific coordinate validation errors
                if (error instanceof DomainError && error.message.includes('coordinates')) {
                    throw error;
                }
                
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to populate directions in RouteTemplate with id ${routeTemplate.id_route_template}: ${error.message}`,
                    cause: error,
                });
            }
        }

        return routeTemplate;
    }

    // Generates the route that the driver will follow to complete a journey
    async generateRouteFromTemplate(body: CreateRouteByTemplateDto): Promise<Route> {
        // origen = stop_initial, destination = stop_final which should already exist in the database upon creation of route template
        let routeTemplate = await this.routeRepository.findRouteTemplateRecordById(body.routeTemplateId);

        // if there is no polyline this means the RoutTemplate doesn't have a predefined set of directions for completing the route yet
        // therefore a route must be generated and the data must be updated in the RouteTemplate record
        if (!routeTemplate.polyline) {
            try {
                const stopInitial = await this.stopRepository.findStopRecordById(routeTemplate.stop_initial);
                const stopFinal = await this.stopRepository.findStopRecordById(routeTemplate.stop_final);
                const directions = await this.routeRepository.prepareRouteTemplateDirections(
                    routeTemplate.id_route_template,
                    stopInitial,
                    stopFinal,
                );

                const routeTemplateData: SetRouteTemplateDirectionsParams = {
                    routeTemplateId: routeTemplate.id_route_template,
                    directions,
                };
                //routeTemplate will be equal to the new updated record
                routeTemplate = await this.setRouteTemplateDirections(routeTemplateData);
            } catch (error) {
                // Pass through specific coordinate validation errors
                if (error instanceof DomainError && error.message.includes('coordinates')) {
                    throw error;
                }
                
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to populate directions in RouteTemplate with id ${routeTemplate.id_route_template}: ${error.message}`,
                    cause: error,
                });
            }
        }

        // Now create the actual route from the template
        const now = new Date();
        const createRouteData: CreateRouteParams = {
            enterpriseId: routeTemplate.id_enterprise,
            clientId: body.clientId,
            vehicleId: body.vehicleId,
            driverId: body.driverId,
            routeTemplateId: routeTemplate.id_route_template,
            name: `${routeTemplate.name} - ${now.toLocaleDateString()}`,
            dateStart: now,
            dateEnd: now,
            polyline: routeTemplate.polyline || '',
            totalDistance: routeTemplate.total_distance || 0,
            totalDuration: routeTemplate.total_duration || 0,
            stopInitial: routeTemplate.stop_initial,
            stopFinal: routeTemplate.stop_final,
            totalStops: routeTemplate.total_stops || 0,
        };

        const newRoute = await this.routeRepository.createRouteRecord(createRouteData);
        return newRoute;
    }

    // Get detailed waypoint information for error messages
    private async getWaypointDetails(routeTemplateId: number) {
        try {
            // Access Prisma through the route repository
            const eventTemplates = await this.routeRepository['prismaRepository'].eventTemplate.findMany({
                where: { id_route_template: routeTemplateId },
                include: { stop: true },
                orderBy: { pos: 'asc' }
            });

            return eventTemplates.map(et => ({
                stopId: et.stop.id_stop,
                stopTitle: et.stop.title,
                coordinates: `${et.stop.lat}, ${et.stop.lon}`,
                address: `${et.stop.line1}, ${et.stop.city}`,
                lat: et.stop.lat,
                lng: et.stop.lon
            }));
        } catch (error) {
            return [];
        }
    }

    // Validate coordinates with detailed waypoint information
    private validateCoordinatesWithDetails(directions: any, waypointDetails: any[]): { isValid: boolean; error?: string } {
        try {
            // Parse origin coordinates
            const originCoords = this.parseCoordinates(directions.origin);
            if (!this.isValidLatLng(originCoords.lat, originCoords.lng)) {
                return {
                    isValid: false,
                    error: `Coordenadas de origen inválidas: ${directions.origin}`
                };
            }

            // Parse destination coordinates  
            const destCoords = this.parseCoordinates(directions.destination);
            if (!this.isValidLatLng(destCoords.lat, destCoords.lng)) {
                return {
                    isValid: false,
                    error: `Coordenadas de destino inválidas: ${directions.destination}`
                };
            }

            // Check Mexico bounds for origin and destination
            if (!this.isInMexico(originCoords.lat, originCoords.lng)) {
                return {
                    isValid: false,
                    error: `Las coordenadas de origen están fuera de México: ${directions.origin}`
                };
            }

            if (!this.isInMexico(destCoords.lat, destCoords.lng)) {
                return {
                    isValid: false,
                    error: `Las coordenadas de destino están fuera de México: ${directions.destination}`
                };
            }

            // Check waypoints if they exist
            if (directions.waypoints && Array.isArray(directions.waypoints)) {
                for (let i = 0; i < directions.waypoints.length; i++) {
                    const waypoint = directions.waypoints[i];
                    const waypointCoords = this.parseCoordinates(waypoint);
                    
                    // Find the correct waypoint info by matching coordinates instead of relying on index
                    const waypointInfo = waypointDetails.find(detail => 
                        Math.abs(detail.lat - waypointCoords.lat) < 0.0001 && 
                        Math.abs(detail.lng - waypointCoords.lng) < 0.0001
                    );
                    
                    if (!this.isValidLatLng(waypointCoords.lat, waypointCoords.lng)) {
                        const stopInfo = waypointInfo ? 
                            `"${waypointInfo.stopTitle}" (ID: ${waypointInfo.stopId}) en ${waypointInfo.address}` :
                            `parada ${i + 1}`;
                        
                        return {
                            isValid: false,
                            error: `Coordenadas inválidas para ${stopInfo}: ${waypoint}. Por favor verifica los datos de ubicación de esta parada.`
                        };
                    }

                    if (!this.isInMexico(waypointCoords.lat, waypointCoords.lng)) {
                        const stopInfo = waypointInfo ? 
                            `"${waypointInfo.stopTitle}" (ID: ${waypointInfo.stopId})` :
                            `parada ${i + 1}`;
                        
                        const locationInfo = waypointInfo?.address ? 
                            ` en ${waypointInfo.address}` : '';
                        
                        return {
                            isValid: false,
                            error: `La parada ${stopInfo}${locationInfo} tiene coordenadas fuera de México: ${waypoint}. Por favor actualiza la ubicación de esta parada para que esté dentro de México.`
                        };
                    }
                }
            }

            return { isValid: true };

        } catch (error) {
            return {
                isValid: false,
                error: `Error parsing coordinates: ${error.message}`
            };
        }
    }

    // Legacy validate coordinates method (keeping for backward compatibility)
    private validateCoordinates(directions: any): { isValid: boolean; error?: string } {
        try {
            // Parse origin coordinates
            const originCoords = this.parseCoordinates(directions.origin);
            if (!this.isValidLatLng(originCoords.lat, originCoords.lng)) {
                return {
                    isValid: false,
                    error: `Invalid origin coordinates: ${directions.origin}`
                };
            }

            // Parse destination coordinates  
            const destCoords = this.parseCoordinates(directions.destination);
            if (!this.isValidLatLng(destCoords.lat, destCoords.lng)) {
                return {
                    isValid: false,
                    error: `Invalid destination coordinates: ${directions.destination}`
                };
            }

            // Check Mexico bounds for origin and destination
            if (!this.isInMexico(originCoords.lat, originCoords.lng)) {
                return {
                    isValid: false,
                    error: `Origin coordinates are outside Mexico: ${directions.origin}`
                };
            }

            if (!this.isInMexico(destCoords.lat, destCoords.lng)) {
                return {
                    isValid: false,
                    error: `Destination coordinates are outside Mexico: ${directions.destination}`
                };
            }

            // Check waypoints if they exist
            if (directions.waypoints && Array.isArray(directions.waypoints)) {
                for (let i = 0; i < directions.waypoints.length; i++) {
                    const waypoint = directions.waypoints[i];
                    const waypointCoords = this.parseCoordinates(waypoint);
                    
                    if (!this.isValidLatLng(waypointCoords.lat, waypointCoords.lng)) {
                        return {
                            isValid: false,
                            error: `Invalid waypoint ${i + 1} coordinates: ${waypoint}`
                        };
                    }

                    if (!this.isInMexico(waypointCoords.lat, waypointCoords.lng)) {
                        return {
                            isValid: false,
                            error: `Waypoint ${i + 1} coordinates are outside Mexico: ${waypoint}`
                        };
                    }
                }
            }

            return { isValid: true };

        } catch (error) {
            return {
                isValid: false,
                error: `Error parsing coordinates: ${error.message}`
            };
        }
    }

    // Parse coordinate string "lat, lng" to object
    private parseCoordinates(coordString: string): { lat: number; lng: number } {
        const parts = coordString.split(',').map(s => s.trim());
        if (parts.length !== 2) {
            throw new Error(`Invalid coordinate format: ${coordString}`);
        }
        
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (isNaN(lat) || isNaN(lng)) {
            throw new Error(`Invalid numeric coordinates: ${coordString}`);
        }
        
        return { lat, lng };
    }

    // Check if coordinates are valid lat/lng values
    private isValidLatLng(lat: number, lng: number): boolean {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    // Check if coordinates are within Mexico bounds (approximate)
    private isInMexico(lat: number, lng: number): boolean {
        // Mexico approximate bounds
        const mexicoBounds = {
            north: 32.7,
            south: 14.5,
            east: -86.7,
            west: -118.4
        };
        
        return lat >= mexicoBounds.south && 
               lat <= mexicoBounds.north && 
               lng >= mexicoBounds.west && 
               lng <= mexicoBounds.east;
    }

    // Get user-friendly error messages for Google Maps API statuses in Spanish
    private getGoogleMapsErrorMessage(status: string, errorMessage?: string): string {
        switch (status) {
            case 'NOT_FOUND':
                return 'No se pudieron encontrar una o más ubicaciones. Por favor verifica las direcciones o coordenadas en tu plantilla de ruta.';
            
            case 'ZERO_RESULTS':
                return 'No se pudo calcular una ruta entre las ubicaciones especificadas. Por favor verifica si las ubicaciones son accesibles por carretera.';
            
            case 'MAX_WAYPOINTS_EXCEEDED':
                return 'Demasiadas paradas en la ruta (máximo 25 permitidas). Por favor reduce el número de paradas en tu plantilla de ruta.';
            
            case 'INVALID_REQUEST':
                return 'Solicitud de ruta inválida. Por favor verifica que todas las coordenadas estén formateadas correctamente y las ubicaciones sean válidas.';
            
            case 'OVER_DAILY_LIMIT':
            case 'OVER_QUERY_LIMIT':
                return 'Cuota de Google Maps API excedida. Por favor intenta de nuevo más tarde o contacta a tu administrador.';
            
            case 'REQUEST_DENIED':
                return 'Acceso denegado a Google Maps API. Por favor verifica la configuración de tu clave API.';
            
            case 'UNKNOWN_ERROR':
                return 'Ocurrió un error desconocido con Google Maps API. Por favor intenta de nuevo.';
            
            default:
                return `Error de Google Maps API (${status}): ${errorMessage || 'Error desconocido'}`;
        }
    }

    async updateRouteTrajectory(body: UpdateRouteDto): Promise<Route> {
        try {
            let route = await this.routeRepository.findRouteRecordById(body.routeId);
            const newStopInitial = await this.stopRepository.findStopRecordById(body.stopInitial);
            const newStopFinal = await this.stopRepository.findStopRecordById(body.stopFinal);
            let params: SetupRouteDirectionsParams;

            let stopWaypointsIds: number[] | undefined;
            if (body.stopWaypoints) {
                const newStopWaypoints = await this.stopRepository.findManyStopsById(body.stopWaypoints);
                stopWaypointsIds = newStopWaypoints.map(stop => stop.id_stop);
                params = {
                    stopInitial: newStopInitial,
                    stopFinal: newStopFinal,
                    stopWaypoints: newStopWaypoints,
                };
            } else {
                params = {
                    stopInitial: newStopInitial,
                    stopFinal: newStopFinal,
                };
            }

            const newDirections = this.mapsService.setUpRouteDirectionsParams(params);
            const routeDirectionsData: UpdateRouteDirectionsParams = {
                route,
                newStopInitial,
                newStopFinal,
                newDirections,
                stopWaypoints: stopWaypointsIds, // Pass stopWaypoints IDs
            };
            route = await this.updateRouteDirections(routeDirectionsData);

            return route;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to update route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }



    async setRouteTemplateDirections(params: SetRouteTemplateDirectionsParams): Promise<RouteTemplate> {
        try {
            // Get detailed waypoint information for better error messages
            const waypointDetails = await this.getWaypointDetails(params.routeTemplateId);
            
            // Validate coordinates before making API call
            const coordinateValidation = this.validateCoordinatesWithDetails(params.directions, waypointDetails);
            if (!coordinateValidation.isValid) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Invalid coordinates detected: ${coordinateValidation.error}`,
                });
            }

            const directions = await this.mapsService.getDirections(params.directions);
            
            // Enhanced validation with specific error messages for different API statuses
            if (!directions.data) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: 'No se recibió respuesta de Google Maps API. Por favor verifica tu conexión a internet.',
                });
            }

            // Handle specific Google Maps API error statuses
            if (directions.data.status !== 'OK') {
                const errorMessage = this.getGoogleMapsErrorMessage(directions.data.status, directions.data.error_message);
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: errorMessage,
                });
            }

            if (!directions.data.routes || 
                !Array.isArray(directions.data.routes) ||
                directions.data.routes.length === 0) {
                
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: 'No se encontraron rutas válidas. Esto puede deberse a ubicaciones de paradas inválidas o destinos inaccesibles.',
                });
            }
            
            const filteredDirections = this.mapsService.filterDirectionsResponse(directions);

            const routeTemplateData: UpdateRouteTemplateParams = {
                polyline: filteredDirections.polyline,
                totalDistance: filteredDirections.totalDistance,
                totalDuration: filteredDirections.totalDuration,
                totalStops: filteredDirections.totalStops,
            };
            const routeTemplate = await this.routeRepository.updateRouteTemplateRecord(params.routeTemplateId, routeTemplateData);
            
            // Skip leg matching for same-location routes (distance = 0) to avoid processing issues
            if (filteredDirections.totalDistance > 0) {
                await this.routeRepository.matchLegsToManyEventTemplateRecords(params.routeTemplateId, directions);
            }

            return routeTemplate;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to get route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async updateRouteDirections(params: UpdateRouteDirectionsParams): Promise<Route> {
        try {
            const directions = await this.mapsService.getDirections(params.newDirections);

            // Improved validation - check for valid routes array and OK status
            if (!directions.data || 
                directions.data.status !== 'OK' ||
                !directions.data.routes || 
                !Array.isArray(directions.data.routes) ||
                directions.data.routes.length === 0) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to generate route, invalid response from Google Maps API. Status: ${directions.data?.status || 'unknown'}`,
                });
            }

            const filteredDirections = this.mapsService.filterDirectionsResponse(directions);

            // Now polyline, totalDistance, totalDuration, and totalStops are available in a normalized form.
            const events = await this.routeRepository.findManyEventRecordsByRouteId(params.route.id_route);
            const completedEvents = events.filter(e =>
                e.status === EventStatus.COMPLETED ||    // paradas formalmente completadas
                e.date_service != null                   // paradas con evidencia subida
            );

            console.log("eventos completados ", completedEvents);

            const totalStops = filteredDirections.totalStops + completedEvents.length;

            const routeData: UpdateRouteParams = {
                polyline: filteredDirections.polyline,
                totalDistance: filteredDirections.totalDistance,
                totalDuration: filteredDirections.totalDuration,
                totalStops: totalStops,
                stopInitial: params.newStopInitial.id_stop,
                stopFinal: params.newStopFinal.id_stop,
            };

            const updatedRoute = await this.routeRepository.updateRouteRecord(params.route.id_route, routeData);
            // Update the route with the new directions
            await this.routeRepository.matchLegsToManyEventRecords(params.route, directions, params.stopWaypoints);

            return updatedRoute;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to update route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error: ${error.message}`,
                cause: error,
            });
        }
    }


    async getRoute(id: number): Promise<Route> {
        try {
            return await this.routeRepository.findRouteRecordById(id);
        } catch (error) {
            if (error instanceof DataBaseError) {
                throw error;
            }

            if (error instanceof DataBaseError) {
                throw new DomainError({
                    domain: 'ROUTE',
                    layer: 'SERVICE',
                    message: `Unable to get route`,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'ROUTE',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }
}
