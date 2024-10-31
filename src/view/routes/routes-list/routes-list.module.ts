import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutesListComponent } from './routes-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    RoutesListComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatIconModule,
    FormsModule,
  ],
  exports: [
    RoutesListComponent,
  ]
})
export class RoutesListModule { }
