import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainViewMapComponent } from './main-view-map.component';



@NgModule({
  declarations: [
    MainViewMapComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MainViewMapComponent,
  ]
})
export class MainViewMapModule { }
