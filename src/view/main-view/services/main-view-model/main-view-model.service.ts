import { Injectable } from '@angular/core';
import { PointMarksService } from '@shared';
import { BehaviorSubject, Subject, catchError, combineLatest, debounceTime, of, switchMap, takeUntil, tap } from 'rxjs';
import { IMainViewModel } from './main-view.model.interface';
import { LoadingStatusType } from 'src/core/types/loading-status.type';
import { IMainViewModelFilters } from './main-view.model.filters.interface';
import { IPointGeoObject } from '@core';
import { GeoobjectModel, GeoobjectService } from '@api';

const DEFAULT_GEOPARK_UID = '41f271c8-e8ba-4225-b21d-403f9751e5a7';
export const DEFAULT_MODEL: IMainViewModel = {
  state$: of('PENDING'),
  search: '',
  filters: {},
  points: [],
  rawPoints: [],
}
@Injectable()
export class MainViewModelService {
  private state$: BehaviorSubject<LoadingStatusType> = new BehaviorSubject<LoadingStatusType>('PENDING');
  private search$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private filter$: BehaviorSubject<IMainViewModelFilters> = new BehaviorSubject<IMainViewModelFilters>({});
  private destroy$: Subject<void> = new Subject<void>();
  public model$: BehaviorSubject<IMainViewModel> = new BehaviorSubject<IMainViewModel>({
    ...DEFAULT_MODEL,
    state$: this.state$.asObservable()
  });

  constructor(private pointMarksService: PointMarksService, private geoobjectService: GeoobjectService) {
    this.search$.pipe(debounceTime(400)).subscribe((search: string) => {
      this.state$.next('PENDING');

      setTimeout(() => {
        const points: IPointGeoObject[] = [...this.model$.value.rawPoints];
        this.model$.next({ ...this.model$.value, points: points.filter((point: IPointGeoObject) => {
          return point.name.toLowerCase().includes(search.toLowerCase()) ||
          point.type.toLowerCase().includes(search.toLowerCase());
        })})
        this.state$.next('SUCCESS');
      })
    });
  }

  public init(): void {
    this.state$.next('PENDING');
    this.geoobjectService.getGeoobjectsByGeoparkGeoobjectGeoparkGeoparkIdGet(DEFAULT_GEOPARK_UID).subscribe({
      next: (geeoobjects: GeoobjectModel[]) => {
        this.state$.next('SUCCESS');
        this.model$.next({
          ...this.model$.value,
          points: [...geeoobjects],
          rawPoints: [...geeoobjects],
        });
      },
      error: () => {
        this.state$.next('ERROR');
      }
    });
  }

  public searchInit(search: string): void {
    this.search$.next(search);
  }
}
