import { Injectable } from '@angular/core';
import { PointMarksService } from '@shared';
import { BehaviorSubject, Subject, catchError, combineLatest, debounceTime, of, switchMap, takeUntil, tap } from 'rxjs';
import { IMainViewModel } from './main-view.model.interface';
import { LoadingStatusType } from 'src/core/types/loading-status.type';
import { IMainViewModelFilters } from './main-view.model.filters.interface';
import { IPointGeoObject } from '@core';


export const DEFAULT_MODEL: IMainViewModel = {
  state$: of('PENDING'),
  search: '',
  filters: {},
  points: [],
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

  constructor(private pointMarksService: PointMarksService) {
    combineLatest([this.search$, this.filter$]).pipe(
      debounceTime(400),
      tap(() => {
        this.state$.next('PENDING');
      }),
      switchMap(([search, filter]: [string, IMainViewModelFilters]) => {
        return this.pointMarksService.getPoints(search).pipe(catchError(() => of(null)))
      }),
      switchMap((points: IPointGeoObject[] | null) => {
        if (points) {
          this.state$.next('SUCCESS')
          this.model$.next({
            ...this.model$.value,
            points
          });
          return of(true);
        }
        this.state$.next('ERROR');
        return of(false);
      })
    ).subscribe()
  }

  public searchInit(search: string): void {
    this.search$.next(search);
  }
}
