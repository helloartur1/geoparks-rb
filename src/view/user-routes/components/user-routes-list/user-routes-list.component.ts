
import { Component, EventEmitter, Input, Output, QueryList, ViewChildren, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';

import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { IRoute, IRouteCache } from '@core';
import { TRouteProfile } from 'src/view/routes/interfaces/route-config.interface';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'geo-user-routes-list',
  templateUrl: './user-routes-list.component.html',
  styleUrls: ['./user-routes-list.component.scss'],
})


export class UserRoutesListComponent {
  @Input() selectedProfile: TRouteProfile = 'foot-walking';
  @Input() formattedDistance?: string;

  @Input() formattedDuration?: string; 
  @Input() selectedSort?: string;
  @Input() routeCacheMap: Map<string, IRouteCache> = new Map();
  @Input() selectedRoute: IRoute | undefined = undefined; 
  
  
  @Output() sortChanged = new EventEmitter<string>(); 
  @Output() clearSearch = new EventEmitter<void>();

  

  @Output() profileChanged = new EventEmitter<TRouteProfile>();
  @Output() showRoute = new EventEmitter<IRoute>();

  private _routes: IRoute[] = [];
  private _routes_user: IRoute[] = [];

  @Input()
  set routes(value: IRoute[]) {
    this._routes = value;
    this.updateCategoryItems();
  }
  get routes(): IRoute[] {
    return this._routes;
  }

  @Input()
  set routes_user(value: IRoute[]) {
    console.log('routes_user:', value); // Отладочный вывод
    this._routes_user = value;
    this.updateCategoryItems();
  }
  get routes_user(): IRoute[] {
    return this._routes_user;
  }

  public categoryItems = [
    {
      name: 'Маршруты геопарка',
      items: this.routes,
    },
    {
      name: 'Сохраненные маршруты',
      items: this.routes_user,
    },
  ];


  @ViewChildren(MatMenuTrigger) public triggers: QueryList<MatMenuTrigger> | undefined = undefined;

  public searchControl: FormControl = new FormControl('');
  public filteredRoutes: IRoute[] = []; 
  public searchText: string = '';  
  private originalRoutesOrder: Map<string, number> = new Map();
  private isInitialLoad = true;


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
        });
        this.isInitialLoad = false;
      }

      if (this.selectedSort) {
        this.sortRoutes(this.selectedSort, false);
      }
    }
  }
  

  constructor(private cdr: ChangeDetectorRef) {}

  private updateCategoryItems(): void {
    this.categoryItems = [
      {
        name: 'Маршруты геопарка',
        items: this.routes,
      },
      {
        name: 'Сохраненные маршруты',
        items: this.routes_user,
      },
    ];
    this.cdr.detectChanges(); // Принудительно обновляем представление
  }

  public trackByCategory(index: number, item: any): number {
    return index;
  }

  public trackByItem(index: number, item: IRoute): string {
    return item.id;
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
    evt.stopPropagation();
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

}

