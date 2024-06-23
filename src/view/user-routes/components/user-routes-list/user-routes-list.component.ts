import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { IRoute } from '@core';

@Component({
  selector: 'geo-user-routes-list',
  templateUrl: './user-routes-list.component.html',
  styleUrls: ['./user-routes-list.component.scss']
})
export class UserRoutesListComponent {
  @Input()
  public routes: IRoute[] = [];

  @Output()
  public showRoute: EventEmitter<IRoute> = new EventEmitter();

  @ViewChildren(MatMenuTrigger) public triggers: QueryList<MatMenuTrigger> | undefined = undefined;
  
  public searchControl: FormControl = new FormControl('');

  public openContextMenu(evt: MouseEvent, index: number): void {
    evt.preventDefault();
    if (this.triggers) {
      this.triggers.get(index)?.openMenu();
    }
  }

  public cancelContextMenu(evt: MouseEvent): void {
    evt.stopPropagation()
  }

  public onShowRoute(route: IRoute): void {
    this.showRoute.emit(route);
  }
}
