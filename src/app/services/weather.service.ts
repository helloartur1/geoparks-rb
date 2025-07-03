import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private apiKey = '03689886a23a94ae47ce45355af884ac'; // 🔥 Вставь свой API-ключ

  constructor(private http: HttpClient) {}

  getWeather$(lat: number, lon: number): Observable<any> {
    const params = {
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.apiKey,
      units: 'metric', 
      lang: 'ru' 
    };

    return this.http.get(this.apiUrl, { params, headers: {} });
  }
}
