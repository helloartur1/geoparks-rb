import { Injectable } from '@angular/core';
// @ts-expect-error miss type declaration
import Openrouteservice from 'openrouteservice-js';
// @ts-expect-error miss type declaration
import polyline from '@mapbox/polyline';
import LineString from 'ol/geom/LineString';
import { Observable } from 'rxjs';
import { IRouteConfig } from '../interfaces/route-config.interface';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenRouteService {

  constructor() { }

  public getRoute$({ coordinates, profile }: IRouteConfig): Observable<Array<[number, number]>> {
    let orsDirections = new Openrouteservice.Directions({ api_key: '5b3ce3597851110001cf6248f0d961a50bc04e17b315f4ccec8fe8de'});
    return from(orsDirections.calculate({
      coordinates: coordinates,
      profile,
      format: 'json',
      radiuses: [10000]
    })).pipe(map((res: any) => {
      const line: LineString = new LineString(polyline.decode(res.routes[0].geometry));
      console.log(polyline.decode(res.routes[0].geometry));
      line.transform('EPSG:4326', 'EPSG:3857');
      return polyline.decode(res.routes[0].geometry).map((item: [number, number]) => item.reverse());
    }));

  }
}
