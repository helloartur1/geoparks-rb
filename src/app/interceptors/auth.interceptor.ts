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

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAuth = this.authService.isAuthenticated();
    if (isAuth) {
      const token = this.localStorageService.getToken();
      request = request.clone({ headers: request.headers.set('Authorization', token ?? '')});
    } 
    return next.handle(request);
  }
}
