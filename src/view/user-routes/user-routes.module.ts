import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutesComponent } from './user-routes.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { UserRoutesListModule } from './components/user-routes-list/user-routes-list.module';



@NgModule({
  declarations: [
    UserRoutesComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    UserRoutesListModule,
  ],
  exports: [
    UserRoutesComponent,
  ],
})
export class UserRoutesModule { }
