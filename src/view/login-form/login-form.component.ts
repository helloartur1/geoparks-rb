import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AppRoutes } from '@core';
import { AuthAdminService, LocalStorageService } from '@shared';

import { take } from 'rxjs';

@Component({
  selector: 'geo-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  public showError: boolean = false;
  public form: FormGroup = new FormGroup({
    userName: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private authAdminService: AuthAdminService, private localStorageService: LocalStorageService, private router: Router) {}

  public loginSubmit(): void {
    
    const { userName, password } = this.form.value;

    this.authAdminService.login({ userName, password } ).pipe(take(1)).subscribe(
      { 
        next: ({ token }: { token: string }) => {
          this.localStorageService.setToken(token);
          this.authAdminService.fillAuthDataByToken();
          this.router.navigate([AppRoutes.MAIN]);
        },
        error: () => {
          this.showError = true;
          setTimeout(() => {
            this.showError = false;
          }, 4000);
        }
      }
    );
  }

}
