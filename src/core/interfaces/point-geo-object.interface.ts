import { IBaseGeoObject } from "./base-geo-object.interface";

export interface IPointGeoObject extends IBaseGeoObject {
    longitude: number;
    latitude: number;
}
