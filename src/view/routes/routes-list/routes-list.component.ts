import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { IPointGeoObject } from '@core';
import { AuthAdminService } from '@shared';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TRouteProfile } from '../interfaces/route-config.interface';

@Component({
  selector: 'geo-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss']
})
export class RoutesListComponent implements OnInit {
  @Input() items: IPointGeoObject[] = [];
  @Input() distance?: string;
  @Input() duration?: string;
  @Input() selectedProfile: TRouteProfile = 'foot-walking';
  @Input() weatherData: any;
  @Input() showRouteButtons = true;

  @Output() toggleWeather = new EventEmitter<void>();
  @Output() toggleChart   = new EventEmitter<void>();
  @Output() addPoint      = new EventEmitter<IPointGeoObject>();
  @Output() deletePoint   = new EventEmitter<string>();
  @Output() profileChanged= new EventEmitter<TRouteProfile>();
  @Output() saveRoute     = new EventEmitter<void>();
  @Output() route         = new EventEmitter<{ from: IPointGeoObject; to: IPointGeoObject }>();
  @ViewChildren(MatMenuTrigger) triggers?: QueryList<MatMenuTrigger>;

  currentPoints: IPointGeoObject[] = [];

  // Search-point control: string input
  pointControl = new FormControl<string>('');
  filteredOptions: Observable<IPointGeoObject[]> = of([]);

  // Controls for Откуда/Куда
  fromControl = new FormControl<IPointGeoObject | string | null>(null);
  toControl   = new FormControl<IPointGeoObject | string | null>(null);
  filteredFromOptions!: Observable<IPointGeoObject[]>;
  filteredToOptions!  : Observable<IPointGeoObject[]>;

  // Track previous selections
  private selectedFromPoint: IPointGeoObject | null = null;
  private selectedToPoint:   IPointGeoObject | null = null;

  showElevationChart = false;
  showWeatherInfo     = false;

  constructor(private authService: AuthAdminService) {}

  ngOnInit(): void {
    // Search-point suggestions
    this.filteredOptions = this.pointControl.valueChanges.pipe(
      startWith(''),
      map(val => this.items.filter(item =>
        item.name.toLowerCase().includes(((val as string) || '').toLowerCase())
      ))
    );

    // From suggestions
    this.filteredFromOptions = this.fromControl.valueChanges.pipe(
      startWith<IPointGeoObject | string | null>(null),
      map(val => this._filter(typeof val === 'string' ? val : val?.name))
    );
    // To suggestions
    this.filteredToOptions = this.toControl.valueChanges.pipe(
      startWith<IPointGeoObject | string | null>(null),
      map(val => this._filter(typeof val === 'string' ? val : val?.name))
    );

    // Handle From selection/clear
    this.fromControl.valueChanges.subscribe(v => {
      if (this.selectedFromPoint) {
        this.currentPoints = this.currentPoints.filter(p => p.id !== this.selectedFromPoint!.id);
        this.deletePoint.emit(this.selectedFromPoint.id);
        this.selectedFromPoint = null;
      }
      if (v && typeof v !== 'string') {
        this.selectedFromPoint = v;
        this.addPoint.emit(v);
        this.currentPoints.push(v);
      }
    });

    // Handle To selection/clear
    this.toControl.valueChanges.subscribe(v => {
      if (this.selectedToPoint) {
        this.currentPoints = this.currentPoints.filter(p => p.id !== this.selectedToPoint!.id);
        this.deletePoint.emit(this.selectedToPoint.id);
        this.selectedToPoint = null;
      }
      if (v && typeof v !== 'string') {
        this.selectedToPoint = v;
        this.addPoint.emit(v);
        this.currentPoints.push(v);
      }
    });
  }

  private _filter(name = ''): IPointGeoObject[] {
    const filterValue = name.toLowerCase();
    return this.items.filter(i => i.name.toLowerCase().includes(filterValue));
  }

  public displayFn(point: IPointGeoObject | string | null): string {
    return typeof point === 'string' ? point : point?.name ?? '';
  }

  public toggleElevationChart(): void {
    this.toggleChart.emit();
  }

  public roundTemperature(temp?: number): number | undefined {
    return temp != null ? Math.round(temp) : undefined;
  }

  public onToggleWeather(): void {
    this.showWeatherInfo = !this.showWeatherInfo;
    this.toggleWeather.emit();
  }

  public getWeatherIconUrl(): string {
    const code = this.weatherData?.weather?.[0]?.icon;
    return code ? `https://openweathermap.org/img/wn/${code}@2x.png` : '';
  }

  public addPointToRoute(): void {
    const point = this.pointControl.value;
    if (point && typeof point !== 'string') {
      this.addPoint.emit(point);
      this.currentPoints.push(point);
      this.pointControl.reset('');
    }
  }

  public deletePointFromRoute(id: string): void {
    this.currentPoints = this.currentPoints.filter(item => item.id !== id);
    this.deletePoint.emit(id);
  }

  public selectProfile(profile: TRouteProfile): void {
    if (this.selectedProfile !== profile) {
      this.selectedProfile = profile;
      this.profileChanged.emit(profile);
    }
  }

  public openContextMenu(evt: MouseEvent, idx: number): void {
    evt.preventDefault();
    this.triggers?.get(idx)?.openMenu();
  }

  public cancelContextMenu(evt: MouseEvent): void {
    evt.stopPropagation();
  }

  public isAdmin(): boolean {
    return this.authService.getAuthData()?.role === 'admin';
  }

  public isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  public onSaveRoute(): void {
    this.saveRoute.emit();
  }

  public drop(event: CdkDragDrop<IPointGeoObject[]>): void {
    moveItemInArray(this.currentPoints, event.previousIndex, event.currentIndex);
  }

  public clearFrom(): void {
    if (this.selectedFromPoint) {
      this.deletePointFromRoute(this.selectedFromPoint.id);
      this.fromControl.setValue(null);
      this.selectedFromPoint = null;
    }
  }

  public clearTo(): void {
    if (this.selectedToPoint) {
      this.deletePointFromRoute(this.selectedToPoint.id);
      this.toControl.setValue(null);
      this.selectedToPoint = null;
    }
  }
  



  public buildRoute(): void {
    const from = this.fromControl.value as IPointGeoObject;
    const to   = this.toControl.value as IPointGeoObject;
    if (from && to) {
      this.route.emit({ from, to });
    }
  }

  public extraControls: FormControl<IPointGeoObject | string | null>[] = [];
public filteredExtraOptions: Observable<IPointGeoObject[]>[] = [];

public addExtraPoint(): void {
  // создаём контрол
  const ctrl = new FormControl<IPointGeoObject | string | null>(null);
  this.extraControls.push(ctrl);

  // настраиваем фильтрацию
  const filtered$ = ctrl.valueChanges.pipe(
    startWith<IPointGeoObject | string | null>(null),
    map(v => this._filter(typeof v === 'string' ? v : v?.name))
  );
  this.filteredExtraOptions.push(filtered$);

  // подписываемся на изменения: сначала удаляем старое, потом добавляем новое
  let selected: IPointGeoObject | null = null;
  ctrl.valueChanges.subscribe(v => {
    if (selected) {
      this.deletePointFromRoute(selected.id);
      selected = null;
    }
    if (v && typeof v !== 'string') {
      this.addPoint.emit(v);
      this.currentPoints.push(v);
      selected = v;
    }
  });
}

public removeExtraPoint(idx: number): void {
  const ctrl = this.extraControls[idx];
  const val = ctrl.value;
  if (val && typeof val !== 'string') {
    this.deletePointFromRoute(val.id);
  }
  this.extraControls.splice(idx, 1);
  this.filteredExtraOptions.splice(idx, 1);
}

  }

