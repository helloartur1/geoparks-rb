import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AppRoutes } from '@core';
import { AuthAdminService } from '@shared';

@Injectable({
  providedIn: 'root'
})
export class MainGuard implements CanActivate {
  constructor(private authAdminService: AuthAdminService, private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authAdminService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate([AppRoutes.MAIN]);
      return false;
    }
  }
}
