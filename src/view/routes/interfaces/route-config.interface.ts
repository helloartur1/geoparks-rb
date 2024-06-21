export type TRouteCoordinates = [number, number];
export type TRouteProfile = 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking';
export interface IRouteConfig {
    coordinates: Array<TRouteCoordinates>;
    profile: TRouteProfile;
}