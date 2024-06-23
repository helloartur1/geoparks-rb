import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { IPointGeoObject } from '@core';
import { AuthAdminService } from '@shared';
import { Observable, map, of, startWith } from 'rxjs';

@Component({
  selector: 'geo-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss']
})
export class RoutesListComponent {
  @Input()
  public items: IPointGeoObject[] = []

  @Output()
  public addPoint: EventEmitter<IPointGeoObject> = new EventEmitter<IPointGeoObject>();

  @Output()
  public deletePoint: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public saveRoute: EventEmitter<void> = new EventEmitter<void>();

  @ViewChildren(MatMenuTrigger) public triggers: QueryList<MatMenuTrigger> | undefined = undefined;
  
  public currentPoints: IPointGeoObject[] = [];

  public pointControl: FormControl = new FormControl('');

  filteredOptions: Observable<IPointGeoObject[]> = of([]);

  constructor(private authService: AuthAdminService,) {
    
  }

  ngOnInit() {
    this.filteredOptions = this.pointControl.valueChanges.pipe(
      startWith(''),
      map((value: string | IPointGeoObject) => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filter(name as string) : this.items.slice();
      }),
    );
  }


  public addPointToRoute(): void {
    const point: IPointGeoObject | undefined = this.pointControl.value;
    if (point) {
      this.addPoint.emit(point);
      this.currentPoints.push(point);
      this.pointControl.patchValue('');
    }
  }

  public deletePointFromRoute(id: string): void {
    this.currentPoints = [...this.currentPoints].filter((item: IPointGeoObject) => item.id !== id);
    this.deletePoint.emit(id);
  } 

  public displayFn(point: IPointGeoObject): string {
    return point && point.name ? point.name : '';
  }

  public openContextMenu(evt: MouseEvent, index: number): void {
    evt.preventDefault();
    if (this.triggers) {
      this.triggers.get(index)?.openMenu();
    }
  }

  public isAdmin(): boolean {
    return this.authService.getAuthData()?.role === 'admin'
  }

  public cancelContextMenu(evt: MouseEvent): void {
    evt.stopPropagation()
  }

  public onSaveRoute(): void {
    this.saveRoute.emit()
  }

  private _filter(name: string): IPointGeoObject[] {
    const filterValue = name.toLowerCase();

    return this.items.filter((item: IPointGeoObject) => item.name.toLowerCase().includes(filterValue));
  }
}
