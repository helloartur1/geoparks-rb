import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoobjectDetailViewComponent } from './geoobject-detail-view.component';
import {AppModule} from "../../app/app.module";
// import { MapGeoobjectDetailViewComponent } from './map-geoobject-detail-view/map-geoobject-detail-view.component';
import { PhotoGeoobjectDetailViewComponent } from './photo-geoobject-detail-view/photo-geoobject-detail-view.component';
import { NameGeoobjectDetailViewComponent } from './name-geoobject-detail-view/name-geoobject-detail-view.component';
import { DescGeoobjectDetailViewComponent } from './desc-geoobject-detail-view/desc-geoobject-detail-view.component';

@NgModule({
  declarations: [
    GeoobjectDetailViewComponent,
    // MapGeoobjectDetailViewComponent,
    PhotoGeoobjectDetailViewComponent,
    NameGeoobjectDetailViewComponent,
    DescGeoobjectDetailViewComponent,
  ],
    imports: [
        CommonModule,
    ],
  exports: [
    GeoobjectDetailViewComponent,
  ],
})
export class GeoobjectDetailViewModule { }
