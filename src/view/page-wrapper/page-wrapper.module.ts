import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageWrapperComponent } from './page-wrapper.component';
import { PageHeaderModule } from './components/page-header/page-header.module';



@NgModule({
  declarations: [
    PageWrapperComponent,
  ],
  imports: [
    CommonModule,
    PageHeaderModule,
  ],
  exports: [
    PageWrapperComponent,
  ]
})
export class PageWrapperModule { }
