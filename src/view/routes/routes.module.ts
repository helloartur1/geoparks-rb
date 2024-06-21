import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutesComponent } from './routes.component';
import { RoutesListModule } from './routes-list/routes-list.module';



@NgModule({
  declarations: [
    RoutesComponent
  ],
  imports: [
    CommonModule,
    RoutesListModule,
  ],
  exports: [
    RoutesComponent,
  ],
})
export class RoutesModule { }
