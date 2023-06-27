import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkerInfoModalComponent } from './marker-info-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';



@NgModule({
  declarations: [
    MarkerInfoModalComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  exports: [
    MarkerInfoModalComponent,
  ]
})
export class MarkerInfoModalModule { }
