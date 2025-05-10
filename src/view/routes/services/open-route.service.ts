// src/app/services/open-route.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
// @ts-expect-error отсутствуют типы
import Openrouteservice from 'openrouteservice-js';
// @ts-expect-error отсутствуют типы
import polyline from '@mapbox/polyline';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import LineString from 'ol/geom/LineString';

import { IRouteConfig } from '../interfaces/route-config.interface';
import { environment } from 'src/environments/enviroments';

export interface IRouteResult {
  coordinates: Array<[number, number]>;      // [lon, lat]
  distance: number;                           // в метрах
  duration: number;                           // в секундах
  ascent?: number;
  descent?: number;
  elevations?: number[];                      // при желании
  formattedCoords?: Array<[number, number, number]>; // [lat, lon, elev]
  steepness_data?: any[]

}

@Injectable({
  providedIn: 'root'
})
export class OpenRouteService {
  private orsKey = environment.orsApiKey;  // положите ключ в environment.ts
  private orsClient = new Openrouteservice.Directions({ api_key: this.orsKey });
  private waterUrl = `${environment.apiUrl}/water-route`;

  constructor(private http: HttpClient) {}

  /**
   * Получить маршрут.
   * - Для profile==='river' идём на свой бэкенд.
   * - Иначе — ORS JS + polyline.
   */
  public getRoute$({ coordinates, profile }: IRouteConfig): Observable<IRouteResult> {
    // 1) Речной профиль
    if (profile === 'river') {
      // а) ровно 2 точки — простой GET
      if (coordinates.length === 2) {
        const [start, end] = coordinates;
        const params = new HttpParams()
          .set('origin.lat', String(start[1]))
          .set('origin.lon', String(start[0]))
          .set('destination.lat', String(end[1]))
          .set('destination.lon', String(end[0]));
        return this.http.get<IRouteResult>(this.waterUrl, { params });
      }
      // б) >2 точек — разбиваем на сегменты и склеиваем
      const legs: [number, number][][] = [];
      for (let i = 0; i < coordinates.length - 1; i++) {
        legs.push([coordinates[i], coordinates[i + 1]]);
      }
      return forkJoin(
        legs.map(pair => {
          const [s, e] = pair;
          const p = new HttpParams()
            .set('origin.lat', String(s[1]))
            .set('origin.lon', String(s[0]))
            .set('destination.lat', String(e[1]))
            .set('destination.lon', String(e[0]));
          return this.http.get<IRouteResult>(this.waterUrl, { params: p }).pipe(
            map(r => r.coordinates as [number, number][])
          );
        })
      ).pipe(
        map((paths: [number, number][][]) => {
          // склеиваем, убирая дубли первой точки каждого сегмента
          const full: [number, number][] = [];
          paths.forEach((pts, idx) => {
            if (idx === 0) {
              full.push(...pts);
            } else {
              full.push(...pts.slice(1));
            }
          });
          alert(coordinates);
          return {
            coordinates: full,
            distance: 0,
            duration: 0
          } as IRouteResult;
        })
      );
    }

    // 2) Обычные профили ORS
    return from(this.orsClient.calculate({
      coordinates,
      profile,
      format: 'json',
      radiuses: Array(coordinates.length).fill(10000),
    })).pipe(
      map((res: any) => {
        // декодируем polyline и меняем [lat,lon] → [lon,lat]
        const decoded = polyline
          .decode(res.routes[0].geometry)
          .map(([lat, lon]: [number, number]) => [lon, lat] as [number, number]);
        const summary = res.routes[0].summary;
        return {
          coordinates: decoded,
          distance: summary.distance,
          duration: summary.duration,
          ascent: summary.ascent,
          descent: summary.descent
        } as IRouteResult;
      })
    );
  }

  /**
   * Получить высоты для маршрута.
   * Для речного профиля можно вернуть пустой ответ или свою логику.
   * Для остальных — ORS geojson + elevation=true.
   */
  public getElevation$({ coordinates, profile }: IRouteConfig): Observable<IRouteResult> {
    if (profile === 'river') {
      // Например, просто возвращаем пустую высоту
      return of({ coordinates, distance: 0, duration: 0 } as IRouteResult);
    }
    return from(this.orsClient.calculate({
      coordinates,
      profile,
      format: 'geojson',
      elevation: true,
      extra_info: ['steepness', 'surface'],
      radiuses: Array(coordinates.length).fill(10000)
    })).pipe(
      map((res: any) => {
        const feature = res.features[0];
        const coords3d: number[][] = feature.geometry.coordinates;
        const formattedCoords = coords3d.map(c => [c[1], c[0], c[2]] as [number,number,number]);
        const summary = feature.properties.summary;
        return {
          coordinates,
          formattedCoords,
          distance: summary.distance,
          duration: summary.duration,
          ascent: summary.ascent,
          descent: summary.descent
        } as IRouteResult;
      })
    );
  }
}
