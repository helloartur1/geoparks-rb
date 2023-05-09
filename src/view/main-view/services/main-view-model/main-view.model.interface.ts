import { IPointGeoObject } from "@core";
import { IMainViewModelFilters } from "./main-view.model.filters.interface";
import { Observable } from "rxjs";
import { LoadingStatusType } from "src/core/types/loading-status.type";

export interface IMainViewModel {
    state$: Observable<LoadingStatusType>
    search: string;
    filters: IMainViewModelFilters;
    points: IPointGeoObject[];
}