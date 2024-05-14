import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes, IUserData } from '@core';
import { AuthAdminService } from '@shared';

@Component({
  selector: 'geo-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  constructor(private router: Router, private authAdminService: AuthAdminService, private activatedRoute: ActivatedRoute) {}

  public moveToMainPage(): void {
    this.router.navigate(['']);
  }

  public get authData(): IUserData | null {
    return this.authAdminService.getAuthData();
  }

  public moveToLoginPage(): void {
    this.router.navigate([AppRoutes.LOGIN]);
  }

  public logout(): void {
    this.authAdminService.logout();
  }

  public showBanner(): boolean {
    return !(this.activatedRoute.snapshot.firstChild?.routeConfig?.path?.includes(AppRoutes.LOGIN));
  }
}
