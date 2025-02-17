import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PageWrapperModule } from '../view/page-wrapper/page-wrapper.module';
import { MainViewModule } from 'src/view/main-view/main-view.module';
import { ApiModule, Configuration } from 'api';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { GeoobjectDetailViewModule } from 'src/view/geoobject-detail-view/geoobject-detail-view.module';
import { BASE_STATIC_URL } from './deps/base-static-url';
import { LoginFormModule } from 'src/view/login-form/login-form.module';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { GeoobjectFormModule } from 'src/view/geoobject-form/geoobject-form.module';
import { MatIconModule } from '@angular/material/icon';
import { RoutesModule } from 'src/view/routes/routes.module';
import { RoutesListModule } from 'src/view/routes/routes-list/routes-list.module';
import { UserRoutesListModule } from 'src/view/user-routes/components/user-routes-list/user-routes-list.module';
import { UserRoutesModule } from 'src/view/user-routes/user-routes.module';
import { FormsModule } from '@angular/forms';
import { SystemRoutesComponent } from '../view/system-routes/system-routes.component';
import { UserRoutesComponent } from 'src/view/user-routes/user-routes.component';

const dbConfig: DBConfig = {
  name: 'RoutesDB',
  version: 1,
  objectStoresMeta: [{
    store: 'routes',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'routeId', keypath: 'routeId', options: { unique: true } },
      { name: 'name', keypath: 'name', options: { unique: false } },
      { name: 'coordinates', keypath: 'coordinates', options: { unique: false } },
      { name: 'distance', keypath: 'distance', options: { unique: false } },
      { name: 'duration', keypath: 'duration', options: { unique: false } }
    ]
  }]
};



@NgModule({
  declarations: [
    AppComponent,
    SystemRoutesComponent
  ],
  imports: [
    NgxIndexedDBModule.forRoot(dbConfig),
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    GeoobjectDetailViewModule,
    GeoobjectFormModule,
    RoutesModule,
    RoutesListModule,
    UserRoutesListModule,
    UserRoutesModule,
    LoginFormModule,
    PageWrapperModule,
    MainViewModule,
    MatIconModule,
    HttpClientModule,
    FormsModule,
    ApiModule.forRoot(() => new Configuration({ basePath: "http://localhost:8000"})),
  ],
  providers: [
    {
      provide: BASE_STATIC_URL,
      useValue: 'http://localhost:8000',
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
  },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
