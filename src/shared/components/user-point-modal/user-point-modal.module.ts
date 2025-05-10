import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { UserPointModalComponent } from './user-point-modal.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    UserPointModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule, // Для работы с формами [(ngModel)]
    MatButtonModule, // Для кнопок
    MatSelectModule, // Для выпадающего списка
    MatInputModule, // Для текстовых полей
    MatDialogModule,
    MatIconModule,
  ],
  exports: [
    UserPointModalComponent,
  ]
})
export class UserPointModalModule { }