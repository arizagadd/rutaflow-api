export type DirectionsRequestParams = {
    origin: string;
    destination: string;
    waypoints?: string[];
    optimize?: boolean;
};
