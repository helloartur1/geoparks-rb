import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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

import { openDB } from 'idb';
import { ServiceWorkerModule } from '@angular/service-worker';

const DB_NAME = 'RoutesDB';
const STORE_NAME = 'routes';

async function initDB() {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

@NgModule({
  declarations: [
    AppComponent,
    SystemRoutesComponent,
  ],
  imports: [
    HttpClientModule,
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
    ApiModule.forRoot(() => new Configuration({ basePath: "http://192.168.1.112:8000"})),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
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
