import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MainViewModelService } from './services/main-view-model/main-view-model.service';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { IMainViewModel } from './services/main-view-model/main-view.model.interface';
import { FormControl } from '@angular/forms';
import { AppRoutes, CoordinatesType } from '@core';
import { AuthAdminService } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserPointModalComponent } from 'src/shared/components/user-point-modal/user-point-modal.component';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent implements OnInit, OnDestroy {
  public model$: Observable<IMainViewModel>;
  public searchControl: FormControl<string | null> = new FormControl<string>('');
  public destroy$ = new Subject<void>();
  public setView$ = new Subject<CoordinatesType>();
  public setSearch$ = new Subject<string>();
  public isSelectingPoint = false;
  currentCoordinates: { latitude: number; longitude: number } | null = null;

  constructor(
    private mainViewModelService: MainViewModelService,
    private authAdminService: AuthAdminService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private authService: AuthAdminService
  ) {
    this.model$ = this.mainViewModelService.model$;
  }

  public ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe((search: string | null) => {
        this.onSearch(search || '');
      });

    const geoparkId: string = this.activatedRoute.snapshot.params['id'];
    this.mainViewModelService.init(geoparkId);
  }

  public onSearch(search: string): void {
    this.mainViewModelService.searchInit(search);
    this.setSearch$.next(search);
  }

  public onSetMapView(coordinates: CoordinatesType): void {
    this.setView$.next(coordinates);
  }

  public get isAdmin(): boolean {
    return this.authService.getAuthData()?.role === 'admin';
  }

  public moveToCreateObject(): void {
    this.router.navigate([`${AppRoutes.CREATE_FORM}/${this.activatedRoute.snapshot.params['id']}`]);
  }

  public navigateToUserPoints(): void {
    this.router.navigate([`${AppRoutes.USER_POINTS}/${this.activatedRoute.snapshot.params['id']}`]);
  }
  //Дублировать метод выше для меток


  public onEditObject(id: string): void {
    this.router.navigate([`${AppRoutes.CREATE_FORM}/${this.activatedRoute.snapshot.params['id']}/${id}`]);
  }

  public navigateToRoutes(): void {
    this.router.navigate([`${AppRoutes.ROUTES}/${this.activatedRoute.snapshot.params['id']}`]);
  }

  public navigateToSystemRoutes(): void {
    this.router.navigate([`${AppRoutes.USER_ROUTES}/${this.activatedRoute.snapshot.params['id']}`]);
  }

  public onMapClick(coords: { lat: number; lng: number }): void {
    if (this.isSelectingPoint) {
      console.log('Выбранные координаты:', coords);
      this.isSelectingPoint = false;
      this.currentCoordinates = {
        latitude: coords.lat,
        longitude: coords.lng
      };
      geoparkId: this.activatedRoute.snapshot.params['id'],
      this.dialog.open(UserPointModalComponent, {
        width: '400px',
        data: {
          geoparkId: this.activatedRoute.snapshot.params['id'],
          coordinates: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        }
      }).afterClosed().subscribe(result => {
        if (result?.action === 'save') {
          console.log('Сохранено:', result.data);
        }
  
        if (result?.action === 'change_location') {
          this.isSelectingPoint = true;
        }
      });
    }
  }
  

  openAddMarkerDialog(): void {
    const dialogRef = this.dialog.open(UserPointModalComponent, {
      width: '400px', 
      data: {
        geoparkId: this.activatedRoute.snapshot.params['id'],
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'save') {
        console.log('Сохранено:', result.data);
      }

      if (result?.action === 'change_location') {
        this.isSelectingPoint = true;
      }
    });
  }
  public isAuthenticated(): boolean {
    return this.authService.isAuthenticated(); // Используем метод из сервиса
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
