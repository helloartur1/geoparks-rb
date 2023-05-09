import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainViewComponent } from './main-view.component';
import { MainViewManagerModule } from './components/main-view-manager/main-view-manager.module';
import { MainViewMapModule } from './components/main-view-map/main-view-map.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MainViewModelService } from './services/main-view-model/main-view-model.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [
    MainViewComponent,
  ],
  imports: [
    CommonModule,
    MainViewManagerModule,
    MainViewMapModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
  ],
  exports: [
    MainViewComponent,
  ],
  providers: [MainViewModelService]
})
export class MainViewModule { }
