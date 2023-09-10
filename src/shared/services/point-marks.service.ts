import { Injectable } from '@angular/core';
import { IPointGeoObject } from '@core';
import { Observable, delay, map, of } from 'rxjs';
import { POINTS } from '../mocks/points';

@Injectable({
  providedIn: 'root'
})
export class PointMarksService {

  constructor() { }

  public getPoints(search: string = ''): Observable<IPointGeoObject[]> {
    return of(POINTS).pipe(delay(1000), map((points: IPointGeoObject[]) => {
      return points.filter((point: IPointGeoObject) => {
        return point.name.toLowerCase().includes(search.toLowerCase()) ||
        point.type.toLowerCase().includes(search.toLowerCase());
      });
    }));
  }
}
