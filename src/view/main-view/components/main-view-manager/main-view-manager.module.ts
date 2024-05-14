import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainViewManagerComponent } from './main-view-manager.component';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
@NgModule({
  declarations: [
    MainViewManagerComponent,
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatExpansionModule,
  ],
  exports: [
    MainViewManagerComponent,
  ],
})
export class MainViewManagerModule { }
