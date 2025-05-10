import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'
import { ReactiveFormsModule } from '@angular/forms';
import { UsersPointsListComponent } from './users-points-list.component';
import { MatIcon } from '@angular/material/icon';
@NgModule({
  declarations: [
    UsersPointsListComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatIcon,
  ]
})
export class UsersPointsListModule { }
