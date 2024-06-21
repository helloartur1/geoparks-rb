import { Injectable } from '@angular/core';
import { AppRoutes, IUserData, decodeTokenPayload, isTokenExpired } from '@core';
import { LocalStorageService } from './local-storage.service';
import { Router } from '@angular/router';
import { AuthService, TokenInfo } from '@api';
import { Observable, map } from 'rxjs';
import { IJwtTokenPayload } from 'src/core/interfaces/token-payload.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthAdminService {
  private authData: IUserData | null = null;

  constructor(private localStorageService: LocalStorageService, private router: Router, private authApiService: AuthService) { }
  public isAuthenticated(): boolean {
    const token = this.localStorageService.getToken();
    if (token) {
      const tokenPayload = decodeTokenPayload(token);
      if (!isTokenExpired(tokenPayload)) {
        return true;
      }
    }
    return false;
  }

  public login(authBody: { userName: string, password: string }): Observable<{ token: string}> {
    const { userName, password } = authBody;
    return this.authApiService.authAuthSignInPost(userName, password).pipe(map((tokenInfo: TokenInfo) => ({ token: tokenInfo.access_token})));
  }

  public fillAuthDataByToken(): void {
    const token: string | null = this.localStorageService.getToken();
    if (token) {
      const tokenPayload: IJwtTokenPayload = decodeTokenPayload(token);
      if (!isTokenExpired(tokenPayload)) {
        this.authData = { id: tokenPayload.id, role: tokenPayload.role, userName: tokenPayload.sub }
      }
    }
  }

  public logout() {
    this.authData = null;
    this.localStorageService.removeToken();
    this.router.navigate([AppRoutes.MAIN]);
  }

  public setAuthData(authData: IUserData | null): void {
    this.authData = authData;
  }

  public getAuthData(): IUserData | null {
    return this.authData;
  }

  public removeAuthData(): void {
    this.setAuthData(null);
  }
}
