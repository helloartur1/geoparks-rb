import { Component, EventEmitter, Input, Output, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { IRoute } from '@core';
import { TRouteProfile } from 'src/view/routes/interfaces/route-config.interface';

@Component({
  selector: 'geo-user-routes-list',
  templateUrl: './user-routes-list.component.html',
  styleUrls: ['./user-routes-list.component.scss'],
})
export class UserRoutesListComponent {
  @Input() selectedProfile: TRouteProfile = 'foot-walking';
  @Input() distance?: string;
  @Input() duration?: string;

  @Output() profileChanged = new EventEmitter<TRouteProfile>();
  @Output() showRoute = new EventEmitter<IRoute>();

  private _routes: IRoute[] = [];
  private _routes_user: IRoute[] = [];

  @Input()
  set routes(value: IRoute[]) {
    this._routes = (value ?? []).filter(route => route.user_id === "1c0b3204-5c44-454f-91c1-e4a48f4ba39c");
    console.log('Геопарковские маршруты:', this._routes);
    this.updateCategoryItems();
  }

  get routes(): IRoute[] {
    return this._routes;
  }

  @Input()
  set routes_user(value: IRoute[]) {
    this._routes_user = value ?? [];
    console.log('Сохраненные маршруты пользователя:', this._routes_user);
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

  constructor(private cdr: ChangeDetectorRef) {}

  private updateCategoryItems(): void {
    this.categoryItems = [
      {
        name: 'Маршруты геопарка',
        items: this._routes,
      },
      {
        name: 'Сохраненные маршруты',
        items: this._routes_user,
      },
    ];
    this.cdr.detectChanges();
  }

  public trackByCategory(index: number): number {
    return index;
  }

  public trackByItem(index: number, item: IRoute): string {
    return item.id;
  }

  public openContextMenu(evt: MouseEvent, index: number): void {
    evt.preventDefault();
    this.triggers?.get(index)?.openMenu();
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
    this.showRoute.emit(route);
  }
}
