import { Injectable } from '@angular/core';
import { GeoobjectModel, GeoobjectService, PhotoService } from '@api';
import { LoadingStatusType } from '@core';
import { BehaviorSubject, Observable, catchError, forkJoin, of, take, tap } from 'rxjs';

export interface IGeoobjectDetailModel {
  state$: Observable<LoadingStatusType>;
  geoobject: GeoobjectModel | null;
  photos: Array<{ path: string}>
}

export const DEFAULT_DETAIL_MODEL_VALUE: IGeoobjectDetailModel = {
  state$: of('PENDING'),
  geoobject: null,
  photos: [],
}
@Injectable({
  providedIn: 'root'
})
export class GeoobjectDetailModelService {
  private state$: BehaviorSubject<LoadingStatusType> = new BehaviorSubject<LoadingStatusType>('PENDING');
  public model$: BehaviorSubject<IGeoobjectDetailModel> = new BehaviorSubject<IGeoobjectDetailModel>({...DEFAULT_DETAIL_MODEL_VALUE, state$: this.state$.asObservable()});

  constructor(private geoobjectService: GeoobjectService, private photoService: PhotoService) { }

  public init(uid: string): void {
    forkJoin([this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(uid), this.photoService.photosByGeoobjectPhotoGeoobjectIdGet(uid).pipe(catchError(() => of([])))]).pipe(
      tap(() => {
      this.state$.next('PENDING');
    }), 
    take(1)
    ).subscribe({
      next: ([geoobject, photos]: [GeoobjectModel, Array<{ path: string}>]) => {
        this.state$.next('SUCCESS');
        this.model$.next({
          ...this.model$.value,
          geoobject,
          photos,
        });
      },
      error: () => {
        this.state$.next('ERROR');
        this.model$.next({
          ...this.model$.value,
          geoobject: null,
          photos: [],
        });
      }
    });
    
  }






}
