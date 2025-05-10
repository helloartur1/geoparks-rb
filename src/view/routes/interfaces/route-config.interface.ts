export type TRouteCoordinates = [number, number];
export type TRouteDistance = number;
export type TRouteProfile = 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking' | 'river';
export interface IRouteConfig {
    coordinates: Array<TRouteCoordinates>;
    profile: TRouteProfile;
   
}