// route.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private apiUrl = 'http://localhost:8000/proxy/openrouteservice'; // URL твоего FastAPI-прокси

  constructor(private http: HttpClient) {}

  getRoute(coords: number[][]): Observable<any> {
    const body = {
      coordinates: coords,
      radiuses: [10000],
      instructions: false,
      profile: 'foot-walking', // или другой профиль
    };

    return this.http.post(this.apiUrl, body);
  }
}
