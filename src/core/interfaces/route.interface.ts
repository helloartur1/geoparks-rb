import { TRouteCoordinates, TRouteProfile } from "src/view/routes/interfaces/route-config.interface";

export interface IRoutePoint {
    geoobject_id: string;
    geoobject_name?: string;
    id: string;
    latitude: number;
    longitude: number;
    order: number;
    route_id: string;
    name: string;
}

export interface IRoute {
    id: string;
    name: string;
    description: string;
    route_points: Array<IRoutePoint>; 
    route_type?: 'admin' | 'user';
}

export interface IRouteCache {
    routeId: string;
    profile: TRouteProfile;
    coordinates: TRouteCoordinates[];
    distance: number;
    duration: number;
  }