// weather.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'https://api.gismeteo.net/v2/weather/current/';
  private apiKey = '56b30cb255.3443075';

  constructor(private http: HttpClient) {}

  getCurrentWeather(cityId: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-Gismeteo-Token': this.apiKey,
      'Accept-Encoding': 'gzip'
    });

    return this.http.get(`${this.apiUrl}${cityId}/`, { headers });
  }
}