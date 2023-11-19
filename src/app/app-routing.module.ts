import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeoobjectDetailViewComponent } from 'src/view/geoobject-detail-view/geoobject-detail-view.component';
import { GeoobjectDetailViewModule } from 'src/view/geoobject-detail-view/geoobject-detail-view.module';
import { MainViewComponent } from 'src/view/main-view/main-view.component';

const routes: Routes = [
  {
    path: '',
    component: MainViewComponent
    //loadChildren: () => import('../view/main-view/main-view.module').then(m => m.MainViewModule),
  },
  {
    path: 'detail/:geoobjectUid',
    component: GeoobjectDetailViewComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
