import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutesComponent } from './routes.component';
import { RoutesListModule } from './routes-list/routes-list.module';
import { SaveRouteDialogModule } from './save-route-dialog/save-route-dialog.module';
import { MatDialogModule } from '@angular/material/dialog';



@NgModule({
  declarations: [
    RoutesComponent
  ],
  imports: [
    CommonModule,
    RoutesListModule,
    MatDialogModule,
  ],
  exports: [
    RoutesComponent,
  ],
})
export class RoutesModule { }
