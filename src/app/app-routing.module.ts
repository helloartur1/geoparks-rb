import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule, Routes } from '@angular/router';
import { AppRoutes } from '@core';
import { GeoobjectDetailViewComponent } from 'src/view/geoobject-detail-view/geoobject-detail-view.component';
import { GeoobjectFormComponent } from 'src/view/geoobject-form/geoobject-form.component';
import { LoginFormComponent } from 'src/view/login-form/login-form.component';
import { MainViewComponent } from 'src/view/main-view/main-view.component';
import { MainGuard } from './guards/main.guard';
import { GeoparksComponent } from 'src/view/geoparks/geoparks.component';
import { MatIconModule } from '@angular/material/icon';
import { RoutesComponent } from 'src/view/routes/routes.component';
import { UserRoutesComponent } from 'src/view/user-routes/user-routes.component';
import { SystemRoutesComponent } from 'src/view/system-routes/system-routes.component';
import { RoutesListComponent } from 'src/view/routes/routes-list/routes-list.component';

const routes: Routes = [
  {
    path: '',
    component: GeoparksComponent,
  },
  {
    path: 'geopark/:id',
    component: MainViewComponent,
  },
  {
    path: 'detail/:geoobjectUid',
    component: GeoobjectDetailViewComponent,
  },
  {
    path: AppRoutes.LOGIN,
    component: LoginFormComponent,
  },
  {
    path: `${AppRoutes.EDIT_FORM}/:geoobjectUid`,
    component: GeoobjectFormComponent,
    canActivate: [MainGuard],
  },
  {
    path: `${AppRoutes.CREATE_FORM}/:geoparkId`,
    component: GeoobjectFormComponent,
    canActivate: [MainGuard],
  },
  {
    path: `${AppRoutes.CREATE_FORM}/:geoparkId/:geoobjectId`,
    component: GeoobjectFormComponent,
    canActivate: [MainGuard],
  },
  {
    path: `${AppRoutes.ROUTES}/:geoparkId`,
    component: RoutesComponent
  },
  {
    path: `${AppRoutes.USER_ROUTES}/:geoparkId`,
    component: UserRoutesComponent,
  },
  {
    path: `${AppRoutes.SYSTEM_ROUTES}/:geoparkId`, 
    component: SystemRoutesComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
