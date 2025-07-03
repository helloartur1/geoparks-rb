import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { AdminStatComponent } from './admin-stat.component';

@NgModule({
  declarations: [
    AdminStatComponent,
  ],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
  ]
})
export class AdminStatModule {}