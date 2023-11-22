import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoobjectDetailViewComponent } from './geoobject-detail-view.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeoobjectDetailViewContentModule } from './geoobject-detail-view-content/geoobject-detail-view-content.module';
import { BASE_STATIC_URL } from 'src/app/deps/base-static-url';

@NgModule({
  declarations: [
    GeoobjectDetailViewComponent,
  ],
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        GeoobjectDetailViewContentModule,
    ],
  exports: [
    GeoobjectDetailViewComponent,
  ],
  providers: [
    {
      provide: BASE_STATIC_URL,
      useValue: 'http://localhost:8000',
    }
  ]
})
export class GeoobjectDetailViewModule { }
