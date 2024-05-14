import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoparkInfoModalComponent } from './geopark-info-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [
    GeoparkInfoModalComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
  ],
  exports: [
    GeoparkInfoModalComponent,
  ],
})
export class GeoparkInfoModalModule { }
