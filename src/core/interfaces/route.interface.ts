export interface IRoutePoint {
    geoobject_id: string;
    id: string;
    latitude: number;
    longitude: number;
    order: number;
}

export interface IRoute {
    id: string;
    name: string;
    description: string;
    route_points: Array<IRoutePoint>; 
}
