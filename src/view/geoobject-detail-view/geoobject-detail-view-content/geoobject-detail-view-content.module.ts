import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoobjectDetailViewContentComponent } from './geoobject-detail-view-content.component';
import { PhotoGeoobjectDetailViewModule } from '../photo-geoobject-detail-view/photo-geoobject-detail-view.module';



@NgModule({
  declarations: [
    GeoobjectDetailViewContentComponent,
  ],
  imports: [
    CommonModule,
    PhotoGeoobjectDetailViewModule,
  ],
  exports: [
    GeoobjectDetailViewContentComponent,
  ]
})
export class GeoobjectDetailViewContentModule { }
