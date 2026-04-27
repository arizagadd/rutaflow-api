import { Client, DirectionsResponse, LatLng, TravelMode, Status } from '@googlemaps/google-maps-services-js';
import { geocode } from '@googlemaps/google-maps-services-js/dist/geocode/geocode';
import { Injectable, BadRequestException } from '@nestjs/common';
import { SetupRouteDirectionsParams } from '../route/types/route.type';
import { DomainError, UnexpectedError } from '../shared/errors/custom-errors';
import { DirectionsRequestParams } from './maps.type';
import polyline from '@mapbox/polyline';

@Injectable()
export class MapsService {
    private googleMapsClient: Client;
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.googleMapsClient = new Client({});
    }

    async getDirections(data: DirectionsRequestParams): Promise<DirectionsResponse> {
        try {
            const origin = await this.convertLocationToLatLng(data.origin);
            const destination = await this.convertLocationToLatLng(data.destination);
            let waypoints: LatLng[];
            let response: DirectionsResponse;

            if (!data.waypoints) {
                // send request to google with only origin and destination
                response = await this.googleMapsClient.directions({
                    // optimize field unnecessary when dealing with 2 points on a map
                    params: {
                        origin,
                        destination,
                        mode: TravelMode.driving,
                        key: this.apiKey,
                    },
                });
            } else {
                // send request with intermediary waypoints
                waypoints = await this.convertLocationsToLatLng(data.waypoints);

                if (waypoints.length > 23) {
                    // Use chunkWaypoints for more than 23 waypoints
                    response = await this.getOptimizedDirectionsViaDirectionsClient(data);
                }else{
                    //Keep original functionality
                    response = await this.googleMapsClient.directions({
                        params: {
                            origin,
                            destination,
                            mode: TravelMode.driving,
                            waypoints,
                            optimize: data.optimize !== false,
                            key: this.apiKey,
                        },
                    });
                }
                
            }
            
            return response;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            if (error.response && error.response.data && error.response.data.error_message) {
                throw new UnexpectedError({
                    domain: 'MAP',
                    layer: 'SERVICE',
                    type: 'UNEXPECTED_ERROR',
                    message: `Google Maps API error: ${error.response.data.error_message} `,
                    cause: error,
                });
            }

            throw new UnexpectedError({
                domain: 'MAP',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    async convertLocationToLatLng(location: string): Promise<LatLng> {
        const params = {
            address: location,
            key: this.apiKey,
        };

        const response = await geocode({ params });

        if (response && response.data && response.data.results && response.data.results.length > 0) {
            return {
                lat: response.data.results[0].geometry.location.lat,
                lng: response.data.results[0].geometry.location.lng,
            };
        } else {
            throw new DomainError({
                domain: 'MAP',
                layer: 'SERVICE',
                message: `Cannot convert location "${location}" to latitude and longitude.`,
            });
        }
    }

    async convertLocationsToLatLng(locations: string[]): Promise<LatLng[]> {
        const convertedLocations: Promise<LatLng>[] = locations.map(async (location) => {
            if (this.isLatLngFormat(location)) {
                const [latStr, lngStr] = location.split(',').map((str) => str.trim());
                return {
                    lat: parseFloat(latStr),
                    lng: parseFloat(lngStr),
                };
            } else {
                return this.convertLocationToLatLng(location);
            }
        });

        return Promise.all(convertedLocations);
    }

    async getOptimizedDirectionsViaDirectionsClient(data: DirectionsRequestParams): Promise<DirectionsResponse> {
        type LatLngLiteral = { lat: number; lng: number }; // if not already declared
        const origin = await this.convertLocationToLatLng(data.origin) as LatLngLiteral;
        const destination = await this.convertLocationToLatLng(data.destination) as LatLngLiteral;
        const rawWaypoints = await this.convertLocationsToLatLng(data.waypoints);
        const CHUNK_SIZE = 23; // max waypoints per request

        // Convert waypoints to LatLng format
        let clusteringWaypoints = rawWaypoints.map((point: { lat: number; lng: number }) => {
            if (typeof point === 'string') {
              throw new Error('Expected LatLng object, got string');
            }
            return {
              lat: point.lat,
              lng: point.lng,
            };
        });

        let clusteringResponse = await this.processJson(clusteringWaypoints, origin, destination);

        const clusterPoints = clusteringResponse.orderedRoute;

        const waypointChunks: LatLngLiteral[][] = this.chunkWaypoints(clusterPoints, CHUNK_SIZE);
        
        let currentOrigin = origin;
        let fullRoute: DirectionsResponse = {
            data: {
                routes: [
                    {
                        legs: [],
                        overview_polyline: { points: '' },
                        bounds: null,
                        summary: '',
                        waypoint_order: [],
                        copyrights: '',
                        warnings: [],
                        fare: undefined,
                        overview_path: []
                    }
                ],
                geocoded_waypoints: [],
                available_travel_modes: [],
                status: Status.OK,
                error_message: ''
            },
            status: 0,
            statusText: '',
            headers: undefined,
            config: undefined
        };
    
        let allDecodedPoints: [number, number][] = [];
    
        for (let i = 0; i < waypointChunks.length; i++) {
            const chunk: LatLngLiteral[] = waypointChunks[i];
        
            const isLastChunk = i === waypointChunks.length - 1;
        
            let chunkWaypoints = chunk;
            let nextDestination = destination;
        
            if (!isLastChunk) {
                nextDestination = chunk[chunk.length - 1];
                chunkWaypoints = chunk.slice(0, -1); // only waypoints, destination is separate
            }
        
            const response = await this.googleMapsClient.directions({
                params: {
                    origin: currentOrigin,
                    destination: nextDestination,
                    waypoints: chunkWaypoints,
                    optimize: data.optimize !== false,
                    mode: TravelMode.driving,
                    key: this.apiKey,
                }
            });
        
            const route = response.data.routes[0];
        
            fullRoute.data.routes[0].legs.push(...route.legs);
        
            if (route.overview_polyline?.points) {
                const decoded = polyline.decode(route.overview_polyline.points);
                allDecodedPoints.push(...decoded);
            }
        
            currentOrigin = nextDestination;
        }
        
    
        // Re-encode all polylines into one
        fullRoute.data.routes[0].overview_polyline.points = polyline.encode(allDecodedPoints);
        return fullRoute;
    }

    async processJson(
        points: { lat: number; lng: number }[],
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
      ): Promise<any> {
        if (!points || points.length === 0) {
          throw new BadRequestException('No se proporcionaron puntos válidos.');
        }
      
        // --- Utility: Euclidean Distance --- 
        // The Euclidean distance between two points (a, b) is given by:
        //    d(a, b) = sqrt((a.lat - b.lat)^2 + (a.lng - b.lng)^2)
        // This formula calculates the straight-line distance (as the crow flies)
        // between two geographic coordinates. Note that for more accurate earth distances,
        // you could consider the Haversine formula, but here we use Euclidean for simplicity.
        function calculateDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
          return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
        }
      
        // --- TSP Insertion Heuristic with Fixed Endpoints ---
        // We create a route starting at the origin and ending at the destination.
        // Then, for each intermediate point, we find the best place (i.e. insertion index)
        // to insert that point so that the increase in total distance is minimized.
        function orderPointsTSP(
          points: { lat: number; lng: number }[],
          origin: { lat: number; lng: number },
          destination: { lat: number; lng: number }
        ): { lat: number; lng: number }[] {
          // Create a copy of the points (the ones to be inserted) so we don’t mutate the original array.
          const remaining = [...points];
      
          // Start with a route having just the origin and destination.
          const route = [origin, destination];
      
          // Continue until all points have been inserted.
          while (remaining.length > 0) {
            let bestIncrease = Infinity;
            let bestInsertionIndex = -1;
            let bestCandidateIndex = -1;
            // Loop through each candidate point not yet in the route.
            for (let i = 0; i < remaining.length; i++) {
              const candidate = remaining[i];
      
              // Try inserting candidate between each pair of consecutive stops in the current route.
              for (let j = 0; j < route.length - 1; j++) {
                const currentStop = route[j];
                const nextStop = route[j + 1];
      
                // Calculate the additional distance if we insert candidate between currentStop and nextStop.
                // That is: distance(currentStop, candidate) + distance(candidate, nextStop) - distance(currentStop, nextStop)
                const increase =
                  calculateDistance(currentStop, candidate) +
                  calculateDistance(candidate, nextStop) -
                  calculateDistance(currentStop, nextStop);
      
                if (increase < bestIncrease) {
                  bestIncrease = increase;
                  bestInsertionIndex = j + 1;
                  bestCandidateIndex = i;
                }
              }
            }
            // Remove the best candidate from the remaining set.
            const bestCandidate = remaining.splice(bestCandidateIndex, 1)[0];
            // Insert it into the current route at the found insertion index.
            route.splice(bestInsertionIndex, 0, bestCandidate);
          }
          return route;
        }
      
        // --- Use the TSP Insertion Heuristic to order the points ---
        const orderedRoute = orderPointsTSP(points, origin, destination);
      
        return {
          orderedRoute,
          numPoints: orderedRoute.length,
        };
    }
      
    
    chunkWaypoints<T>(waypoints: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < waypoints.length; i += chunkSize) {
            chunks.push(waypoints.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Normalizes the directions response so that downstream processing can use
     * consistent properties (polyline, totalDistance, totalDuration, totalStops).
     * This function handles both the legacy Directions API response and the
     * optimized Routes Preferred API response.
     */
    filterDirectionsResponse(directions: DirectionsResponse | any): {
        polyline: string;
        totalDistance: number;
        totalDuration: number;
        totalStops: number;
    } {
        const route = directions.data.routes[0];
    
        // Compute polyline: Use overview_polyline if available, otherwise try to compute it.
        let polylineStr: string = '';
        if (route.overview_polyline && route.overview_polyline.points){
            polylineStr = route.overview_polyline.points;
        }
    
        // Compute totalDistance & totalDuration
        let totalDistance = 0;
        let totalDuration = 0;
        let totalStops = 0;
        
        // Legacy response: iterating over legs
        if (typeof route.distanceMeters === 'number' && typeof route.duration === 'string') {
            
            // Optimized response may include properties at the route level.
            // For example, if distanceMeters exists:
            totalDistance = route.distanceMeters;
            // For duration, assuming it's a string like '17101s'
            totalDuration = parseInt(route.duration.replace('s', ''), 10);
            // If no leg details, you might need your own logic to calculate stops.
            totalStops = 0;
        }else if(typeof route.distanceMeters === 'number' && typeof route.duration === 'number'){

            totalDistance = route.distanceMeters;
            totalDuration = route.duration;
            totalStops = 0;
        } else if(route.legs && Array.isArray(route.legs) && route.legs.length > 0) {
            totalDistance = route.legs.reduce((sum: number, leg: any) => {
                // In legacy responses, leg.distance.value (in meters)
                return sum + (leg.distance?.value || 0);
            }, 0);
        
            totalDuration = route.legs.reduce((sum: number, leg: any) => {
                // In legacy responses, leg.duration.value (in seconds)
                return sum + (leg.duration?.value || 0);
            }, 0);
        
            // Total stops is typically the number of legs plus one (origin and destination)
            totalStops = route.legs.length + 1;
        }
    
        return {
            polyline: polylineStr,
            totalDistance,
            totalDuration,
            totalStops,
        };
    }
  
    setUpRouteDirectionsParams(params: SetupRouteDirectionsParams): DirectionsRequestParams {
        try {
            const origin = `${params.stopInitial.lat}, ${params.stopInitial.lon}`;
            const destination = `${params.stopFinal.lat}, ${params.stopFinal.lon}`;
            const coordinatesSet = new Set<string>(); // Using Set to ensure uniqueness
            let requestData: DirectionsRequestParams;

            if (!params.stopWaypoints) {
                // user only wants directions towards one location
                requestData = {
                    origin,
                    destination,
                };
            } else {
                params.stopWaypoints.forEach((stop) => {
                    const { lat, lon } = stop;

                    // Checking if the coordinates are neither for stop_initial nor for stop_final
                    if (
                        !(
                            (lat === params.stopInitial?.lat && lon === params.stopInitial?.lon) ||
                            (lat === params.stopFinal?.lat && lon === params.stopFinal?.lon)
                        )
                    ) {
                        coordinatesSet.add(`${lat}, ${lon}`);
                    }
                });

                requestData = {
                    origin,
                    destination,
                    waypoints: Array.from(coordinatesSet), // Converting Set back to Array
                    optimize: params.optimize,
                };
            }

            return requestData;
        } catch (error) {
            throw new UnexpectedError({
                domain: 'MAP',
                layer: 'SERVICE',
                type: 'UNEXPECTED_ERROR',
                message: `Error:${error.message}`,
                cause: error,
            });
        }
    }

    isLatLngFormat(location: string): boolean {
        const latLngRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
        return latLngRegex.test(location);
    }

}
