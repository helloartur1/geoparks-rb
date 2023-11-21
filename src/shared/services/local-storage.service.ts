import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  public setToken(token: string): void {
    localStorage.setItem('geoparks-token', token);
  }

  public getToken(): string | null {
    return localStorage.getItem('geoparks-token');
  }

  public removeToken(): void {
    localStorage.removeItem('geoparks-token');
  }
}
