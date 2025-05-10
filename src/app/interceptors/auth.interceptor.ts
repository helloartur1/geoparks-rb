import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthAdminService, LocalStorageService } from '@shared';



@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthAdminService, private localStorageService: LocalStorageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Не добавляем токен к запросам к OpenWeatherMap
    if (req.url.includes('api.openweathermap.org')) {
      return next.handle(req);
    }

    // Добавляем токен к другим запросам
    const authToken = this.localStorageService.getToken();
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`),
    });
    return next.handle(authReq);
  }
}
