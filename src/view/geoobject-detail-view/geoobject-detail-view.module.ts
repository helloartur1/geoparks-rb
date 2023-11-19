import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoobjectDetailViewComponent } from './geoobject-detail-view.component';
import { PhotoGeoobjectDetailViewComponent } from './photo-geoobject-detail-view/photo-geoobject-detail-view.component';
import { NameGeoobjectDetailViewComponent } from './name-geoobject-detail-view/name-geoobject-detail-view.component';
import { DescGeoobjectDetailViewModule } from './desc-geoobject-detail-view/desc-geoobject-detail-view.module';

@NgModule({
  declarations: [
    GeoobjectDetailViewComponent,
    PhotoGeoobjectDetailViewComponent,
    NameGeoobjectDetailViewComponent,
  ],
    imports: [
        CommonModule,
        DescGeoobjectDetailViewModule,
    ],
  exports: [
    GeoobjectDetailViewComponent,
  ],
})
export class GeoobjectDetailViewModule { }
