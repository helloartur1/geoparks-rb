import { Component, OnInit } from '@angular/core';
import { YA_LAYER, LAYER_TOROTAU, AuthAdminService, CommonTypeIconMap } from '@shared'
import Map from 'ol/Map';
import View, { ViewOptions } from 'ol/View';
import Tile from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text.js';
import Style from 'ol/style/Style';
import { ActivatedRoute } from '@angular/router';
import { GeoobjectModel, GeoobjectService, RouteService } from '@api';
import { take, Observable, forkJoin } from 'rxjs';
import { IPointGeoObject, IRoute, IRoutePoint } from '@core';
import { OpenRouteService } from '../routes/services/open-route.service';
import { TRouteCoordinates } from '../routes/interfaces/route-config.interface';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import Icon from 'ol/style/Icon';
export const GeoparksCoordsMap: {[key: string]: { latitude:number, longitude: number, layer: any }} = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': {
    latitude: 55.2455,
    longitude: 58.2935,
    layer: YA_LAYER,
  },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': {
    latitude: 53.554764,
    longitude: 56.096764,
    layer: LAYER_TOROTAU,
  }

};
@Component({
  selector: 'geo-user-routes',
  templateUrl: './user-routes.component.html',
  styleUrls: ['./user-routes.component.scss']
})
export class UserRoutesComponent implements OnInit {
  public map: Map | undefined = undefined;
  public lineLayer: VectorLayer<any> | undefined = undefined;
  public markerLayer: VectorLayer<any> | undefined = undefined;
  public routes: Array<IRoute> = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private authAdminService: AuthAdminService,
    private openRouteService: OpenRouteService,
    private geoobjectService: GeoobjectService,
    ) {}

  public ngOnInit(): void {
    const userId: string = this.authAdminService.getAuthData()?.id || '';
    if (userId) {
      this.routeService.getRouteRouteUserUserIdGet(userId)
      .pipe(take(1))
      .subscribe((routes: any) => {
        this.routes = routes;
      });
    }
    
    
  }
  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.map = new Map({
        layers: [
          new Tile({
            source: new OSM(),
          }),
        ],
        target: 'map',
        view: new View({ 
          center: fromLonLat([55.958596, 54.735148]),
          zoom: 7,
        }),
      });
    });
  }

  public showRoute(route: IRoute): void {
    if (this.markerLayer) {
      this.map?.removeLayer(this.markerLayer);
    }

    if (this.lineLayer) {
      this.map?.removeLayer(this.lineLayer);
    }

    const coordinates: TRouteCoordinates[] = [];
      route.route_points.forEach((point: IRoutePoint) => {
        coordinates.push([point.longitude, point.latitude]);
      });
      this.openRouteService.getRoute$({ coordinates, profile: 'foot-walking'}).pipe(take(1)).subscribe((res: Array<[number, number]>) => {
        const lineStr: LineString = new LineString(res as any);
        lineStr.transform('EPSG:4326', 'EPSG:3857');
        const lineLayerSource = new VectorSource({
          features: [new Feature({
            geometry: lineStr
            ,
          }),]
        })
        const lineLayer: VectorLayer<any> = new VectorLayer({
          source: lineLayerSource,
          style: new Style({
            stroke: new Stroke({
              color: 'red',
              width: 3,
            }),
          })
        });
        this.lineLayer = lineLayer;
        this.map?.addLayer(this.lineLayer);
      });
      const geeoobjectsStreams$: Array<Observable<GeoobjectModel>> = route.route_points.map((point: IRoutePoint) => {
        return this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(point.geoobject_id);
      });
      forkJoin(geeoobjectsStreams$).pipe(take(1)).subscribe((points: IPointGeoObject[]) => {
        const features: Feature<Point>[] = this.getFeatures(points);
        const markerLayer: VectorLayer<any> = new VectorLayer<any>({
          source: new VectorSource({
            features,
          }),
        });
        this.markerLayer = markerLayer;
        this.map?.addLayer(markerLayer);
      });
  }

  private getFeatures(points: IPointGeoObject[]): Feature<Point>[] {
    const features: Feature<Point>[] = points.map((point: IPointGeoObject, index: number) => {
      const feature: Feature<Point> = new Feature<Point>({ 
        geometry: new Point(fromLonLat([point.longitude, point.latitude])), 
        ...point, 
      });
      feature.setId(point.id);
      feature.setStyle(new Style({
           text: new Text({
             text: (index + 1) + '.' + point.name,
             offsetY: 20,
             font: '10px sans-serif'
           }),
           image: new Icon({src: `../../../../assets/icons/${CommonTypeIconMap.get((point as GeoobjectModel).commonType)}`, scale: [0.45, 0.45]}),
      }));
      return feature;
    });
    return features;
  }
}
