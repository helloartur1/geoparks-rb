import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoobjectDetailViewComponent } from './geoobject-detail-view.component';



@NgModule({
  declarations: [
    GeoobjectDetailViewComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GeoobjectDetailViewComponent,
  ],
})
export class GeoobjectDetailViewModule { }
