import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutesListComponent } from './user-routes-list.component';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    UserRoutesListComponent
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  exports: [
    UserRoutesListComponent,
  ]
})
export class UserRoutesListModule { }
