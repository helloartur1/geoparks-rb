import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoobjectFormComponent } from './geoobject-form.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    GeoobjectFormComponent
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
  ]
})
export class GeoobjectFormModule { }
