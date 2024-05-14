import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutesComponent } from './routes.component';



@NgModule({
  declarations: [
    RoutesComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    RoutesComponent,
  ],
})
export class RoutesModule { }
