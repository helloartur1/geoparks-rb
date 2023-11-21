import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule, Routes } from '@angular/router';
import { AppRoutes } from '@core';
import { GeoobjectDetailViewComponent } from 'src/view/geoobject-detail-view/geoobject-detail-view.component';
import { GeoobjectFormComponent } from 'src/view/geoobject-form/geoobject-form.component';
import { LoginFormComponent } from 'src/view/login-form/login-form.component';
import { MainViewComponent } from 'src/view/main-view/main-view.component';
import { MainGuard } from './guards/main.guard';

const routes: Routes = [
  {
    path: '',
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
    path: AppRoutes.CREATE_FORM,
    component: GeoobjectFormComponent,
    canActivate: [MainGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
