import { Component, EventEmitter, Input, Output, QueryList, ViewChildren,OnChanges, SimpleChanges} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { IRoute, IRouteCache } from '@core';
import { TRouteProfile } from 'src/view/routes/interfaces/route-config.interface';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { RouteService } from '@api';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'geo-user-routes-list',
  templateUrl: './user-routes-list.component.html',
  styleUrls: ['./user-routes-list.component.scss']
})


export class UserRoutesListComponent {
  @Input()
  public routes: IRoute[] = [];
  @Input() selectedProfile: TRouteProfile = 'foot-walking'; 
  @Input() distance?: string;
  @Input() duration?: string; 
  @Input() selectedSort?: string;
  @Input() routeCacheMap: Map<string, IRouteCache> = new Map();
  @Input() selectedRoute: IRoute | undefined = undefined; 
  @Output() showRoute = new EventEmitter<IRoute>();
  @Output() profileChanged = new EventEmitter<TRouteProfile>();
  @Output() sortChanged = new EventEmitter<string>(); 
  @Output() clearSearch = new EventEmitter<void>();

  @ViewChildren(MatMenuTrigger) public triggers: QueryList<MatMenuTrigger> | undefined = undefined;
  
  public searchControl: FormControl = new FormControl('');
  public filteredRoutes: IRoute[] = []; 
  public searchText: string = '';  
  private originalRoutesOrder: Map<string, number> = new Map();
  private isInitialLoad = true;
  public avgRatings: { [routeId: string]: number } = {};

  constructor(
    private routeService: RouteService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged() 
      )
      .subscribe(searchText => {
        this.filterRoutes(searchText);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['routes'] && this.routes?.length) {
      this.filteredRoutes = [...this.routes];
      if (this.isInitialLoad) {
        this.routes.forEach((route, index) => {
          this.originalRoutesOrder.set(route.id, index);
          this.loadAvgRating(route.id);
        });
        this.isInitialLoad = false;
      }

      if (this.selectedSort) {
        this.sortRoutes(this.selectedSort, false);
      }
    }
  }
  
  public openContextMenu(evt: MouseEvent, index: number): void {
    evt.preventDefault();
    if (this.triggers) {
      this.triggers.get(index)?.openMenu();
    }
  }
  public selectProfile(profile: TRouteProfile): void {
    if (this.selectedProfile !== profile) {
      this.selectedProfile = profile;
      this.profileChanged.emit(profile);
    }
  }
  public cancelContextMenu(evt: MouseEvent): void {
    evt.stopPropagation()
  }

  public onShowRoute(route: IRoute): void {
    if (this.selectedRoute === route) return;

    this.selectedRoute = route;
    this.showRoute.emit(route);
    this.searchControl.setValue(''); // Очищаем поле поиска
    this.filteredRoutes = [];
  }

  public sortRoutes(criteria: string, emitEvent: boolean = true): void {
    this.selectedSort = criteria;

    const getValue = (route: IRoute, key: 'distance' | 'duration') => 
      this.routeCacheMap.get(route.id)?.[key] ?? Infinity;
    const routesCopy = [...this.routes];

    switch (criteria) {
      case 'distance-asc':
        routesCopy.sort((a, b) => getValue(a, 'distance') - getValue(b, 'distance'));
        break;
      case 'distance-desc':
        routesCopy.sort((a, b) => getValue(b, 'distance') - getValue(a, 'distance'));
        break;
      case 'time-asc':
        routesCopy.sort((a, b) => getValue(a, 'duration') - getValue(b, 'duration'));
        break;
      case 'time-desc':
        routesCopy.sort((a, b) => getValue(b, 'duration') - getValue(a, 'duration'));
        break;
      case 'original':
      default:
        routesCopy.sort((a, b) => 
          (this.originalRoutesOrder.get(a.id) ?? 0) - (this.originalRoutesOrder.get(b.id) ?? 0)
        );
        break;
    }
    if (JSON.stringify(this.routes) !== JSON.stringify(routesCopy)) {
      this.routes = routesCopy;
    }

    if (emitEvent) {
      this.sortChanged.emit(criteria);
    }
  }

  private filterRoutes(searchText: string): void {
    if (!searchText) {
        this.filteredRoutes = [...this.routes];
        return;
    }

    const searchTerm = searchText.toLowerCase().trim();
    
    this.filteredRoutes = this.routes.filter(route => {
        return route.name.toLowerCase().startsWith(searchTerm);
    });
}

  public onClearSearch(): void {
    this.searchControl.setValue('');
    this.clearSearch.emit();
  }

  public showRatingPanel: { [routeId: string]: boolean } = {};
  public currentRating: { [routeId: string]: number } = {};

  toggleRating(routeId: string): void {
    this.showRatingPanel[routeId] = !this.showRatingPanel[routeId];
  }

  rateRoute(routeId: string, score: number): void {
    this.currentRating[routeId] = score;

    this.routeService.createRouteRatingRouteRouteIdRatePost(routeId, score).subscribe({
      next: () => {
          this.snackBar.open('Оценка успешно добавлена', 'OK', {
          duration: 3000,          // появится на 3 секунды
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });

        // при желании обновляем средний рейтинг
        this.loadAvgRating(routeId);
        this.showRatingPanel[routeId] = false;
      },
      error: (err) => {
        console.error('Ошибка при отправке оценки', err);
      }
    });
  }

loadAvgRating(routeId: string): void {
  this.routeService.getAvgScoreRouteRouteRouteIdAvgRateGet(routeId).subscribe({
    next: (res: any) => {
      console.log(`Средняя оценка для маршрута ${routeId}:`, res);
      this.avgRatings[routeId] = res.average_score;
    },
    error: (err) => {
      console.error(`Ошибка при получении оценки маршрута ${routeId}:`, err);
      this.avgRatings[routeId] = 0;
    }
  });
}


}

