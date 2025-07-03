import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutesListComponent } from './user-routes-list.component';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
<<<<<<< HEAD
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
=======
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86


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
<<<<<<< HEAD
    MatSnackBarModule,
=======
    CommonModule,
    MatExpansionModule, // Модуль для mat-expansion-panel
    MatListModule,      // Модуль для mat-list
    MatIconModule,      // Модуль для mat-icon
    MatButtonModule,    // Модуль для mat-button
    MatMenuModule,      // Модуль для mat-menu
    MatFormFieldModule, // Модуль для mat-form-field
    MatInputModule,     // Модуль для mat-input
    FormsModule,        // Модуль для работы с формами
    ReactiveFormsModule,
>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86
  ],
  exports: [
    UserRoutesListComponent,
  ]
})
export class UserRoutesListModule { }
