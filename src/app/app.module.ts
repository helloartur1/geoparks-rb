import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PageWrapperModule } from '../view/page-wrapper/page-wrapper.module';
import { MainViewModule } from 'src/view/main-view/main-view.module';
import { ApiModule, Configuration } from 'api';
import { HttpClientModule } from '@angular/common/http';
import { GeoobjectDetailViewModule } from 'src/view/geoobject-detail-view/geoobject-detail-view.module';
import { BASE_STATIC_URL } from './deps/base-static-url';
import { LoginFormModule } from 'src/view/login-form/login-form.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    GeoobjectDetailViewModule,
    LoginFormModule,
    PageWrapperModule,
    MainViewModule,
    HttpClientModule,
    ApiModule.forRoot(() => new Configuration({ basePath: "http://localhost:8000"})),
  ],
  providers: [
    {
      provide: BASE_STATIC_URL,
      useValue: 'http://localhost:8000',
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
