import { Component } from '@angular/core';
import { MainViewModelService } from './services/main-view-model/main-view-model.service';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { IMainViewModel } from './services/main-view-model/main-view.model.interface';
import { FormControl } from '@angular/forms';
import { AppRoutes, CoordinatesType } from '@core';
import { AuthAdminService } from '@shared';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent {
  public model$: Observable<IMainViewModel>;
  public searchControl: FormControl<string | null> = new FormControl<string>('');
  public destroy$: Subject<void>= new Subject<void>();
  public setView$: Subject<CoordinatesType> = new Subject<CoordinatesType>();
  public setSearch$: Subject<string> = new Subject<string>();
  constructor(private mainViewModelService: MainViewModelService, private authAdminService: AuthAdminService, private router: Router, private activatedRoute: ActivatedRoute) {
    this.model$ = this.mainViewModelService.model$;
  }

  public ngOnInit(): void {
    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(200)).subscribe((search: string | null) => {
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
    return !!this.authAdminService.getAuthData();
  }

  public moveToCreateObject(): void {
    this.router.navigate([`${AppRoutes.CREATE_FORM}/${this.activatedRoute.snapshot.params['id']}`]);
  }

  public onEditObject(id: string): void {
    this.router.navigate([`${AppRoutes.CREATE_FORM}/${this.activatedRoute.snapshot.params['id']}/${id}`]);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }

  public navigateToRoutes(): void {
    this.router.navigate([`${AppRoutes.ROUTES}/${this.activatedRoute.snapshot.params['id']}`]);
  }
  public navigateToSystemRoutes(): void {
    this.router.navigate([`${AppRoutes.USER_ROUTES}/${this.activatedRoute.snapshot.params['id']}`]);
  }

}
