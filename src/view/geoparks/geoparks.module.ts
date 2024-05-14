import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { GeoparksComponent } from './geoparks.component';
import { MatButtonModule } from '@angular/material/button';
import { GeoparkInfoModalModule } from '@shared';




@NgModule({
  declarations: [
    GeoparksComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    GeoparkInfoModalModule,
  ],
  exports: [
    GeoparksComponent,
  ],
})
export class GeoparksModule { }
