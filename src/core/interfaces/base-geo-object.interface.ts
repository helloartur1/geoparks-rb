export interface IBaseGeoObject {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    common_type?: string;
}
