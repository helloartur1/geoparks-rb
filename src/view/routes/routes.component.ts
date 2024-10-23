import { Component } from '@angular/core';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Tile from 'ol/layer/Tile';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import View, { ViewOptions } from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { get as getProjection } from 'ol/proj.js';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { AuthAdminService, CommonTypeIconMap, HISTORY_CULTURE_GAF, LAYER_TOROTAU, PROM_ROUTE, YA_LAYER } from '@shared';
import VectorLayer from 'ol/layer/Vector';
import { OpenRouteService } from './services/open-route.service';
import LineString from 'ol/geom/LineString';
import { Feature } from 'ol';
import { GeoobjectModel, GeoobjectService, RoutePointPost, RouteService } from '@api';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { AppRoutes, IPointGeoObject } from '@core';
import { Point } from 'ol/geom';
import Icon from 'ol/style/Icon';
import { TRouteCoordinates } from './interfaces/route-config.interface';
import Text from 'ol/style/Text.js';
import { MatDialog } from '@angular/material/dialog';
import { SaveRouteDialogComponent } from './save-route-dialog/save-route-dialog.component';

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

const DEFAULT_EXTENT: ViewOptions = {
  center: fromLonLat([55.958596, 54.735148]),
  zoom: 9,
  projection: getProjection('EPSG:3857')!,
}

@Component({
  selector: 'geo-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss']
})
export class RoutesComponent {
  public map: Map | undefined = undefined;
  public route: Array<[number, number]> | undefined = undefined;
  public items: IPointGeoObject[] = [];
  public lineLayer: VectorLayer<any> | undefined = undefined;
  public markerLayer: VectorLayer<any> | undefined = undefined;
  public points: IPointGeoObject[] = [];

  public distance: number | undefined = undefined;
  public duration: number | undefined = undefined;

  constructor(
    private openRouteService: OpenRouteService,
    private geoobjectService: GeoobjectService,
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  public ngOnInit(): void {
    const geoparkId: string = this.activatedRoute.snapshot.params['geoparkId'];
    this.geoobjectService.getGeoobjectsByGeoparkGeoobjectGeoparkGeoparkIdGet(geoparkId).pipe(take(1)).subscribe((items: GeoobjectModel[]) => {
      this.items = items;
    });
  }

  public onAddPoint(point: IPointGeoObject): void {
    this.points.push(point);
    this.calculateRoute();
  }



  public onSaveRoute(): void {
    this.dialog.open(SaveRouteDialogComponent, {
      width: '300px',
      data: {}
    }).afterClosed().pipe(take(1)).subscribe((routeName: string | undefined | null) => {
      if (routeName) {
        const points: Array<RoutePointPost> = this.points.map((point: IPointGeoObject, index: number) => {
          return {
            latitude: point.latitude,
            longitude: point.longitude,
            order: index,
            geoobject_id: point.id,
          }
        });
        this.routeService.postRouteRoutePost({
          route: {
            name: routeName,
          },
          points,
        }).pipe(take(1)).subscribe(() => {
          this.router.navigate([`${AppRoutes.MAIN}`]);
        });
      }
    })
  }

  public onDeletePoint(id: string): void {
    this.points = [...this.points].filter((item: IPointGeoObject) => item.id !== id);
    this.calculateRoute();
  }
  public formattedDistance: string | undefined = undefined; // Step 1
  public calculateRoute(): void {
    if (this.markerLayer) {
      this.map?.removeLayer(this.markerLayer);
    }

    if (this.lineLayer) {
      this.map?.removeLayer(this.lineLayer);
    }

    if (this.points.length < 2) {
      this.markerLayer = this.createMarkerLayer();
      this.map?.addLayer(this.markerLayer);
    } else {
      const coordinates: TRouteCoordinates[] = [];
      this.points.forEach((point: IPointGeoObject) => {
        coordinates.push([point.longitude, point.latitude]);
      });

      this.openRouteService.getRoute$({ coordinates, profile: 'cycling-regular' })
        .pipe(take(1))
        .subscribe((res) => {
          const { coordinates: routeCoordinates, distance, duration } = res; // Деструктурируем ответ
          const lineStr: LineString = new LineString(routeCoordinates as any);
          lineStr.transform('EPSG:4326', 'EPSG:3857');

          const lineLayerSource = new VectorSource({
            features: [new Feature({
              geometry: lineStr,
            })]
          });

          const lineLayer: VectorLayer<any> = new VectorLayer({
            source: lineLayerSource,
            style: new Style({
              stroke: new Stroke({
                color: 'red',
                width: 3,
              }),
            }),
          });

          // Создаем отдельный источник и слой для меток расстояния и времени
          const labelSource = new VectorSource();
          const labelLayer = new VectorLayer({
            source: labelSource,
          });

          // Получаем среднюю точку маршрута для отображения меток
          const middlePointCoord = lineStr.getCoordinateAt(0.5); // Получаем середину линии

          if (middlePointCoord) {
            // Метка расстояния
            const distanceFeature = new Feature({
              geometry: new Point(middlePointCoord),
            });

            const distanceInKm = (distance / 1000).toFixed(2); // Конвертируем в километры
            distanceFeature.setStyle(new Style({
              text: new Text({
                text: `${distanceInKm} km`,
                font: '12px Arial',
                fill: new Fill({
                  color: '#000',
                }),
                stroke: new Stroke({
                  color: '#fff',
                  width: 3,
                }),
                offsetY: -15, // Перемещаем метку над линией
              })
            }));

            labelSource.addFeature(distanceFeature);

            // Метка продолжительности
            this.distance = distance; 
            this.formattedDistance = (distance / 1000).toFixed(2) + ' km'; 
            const durationInMinutes = (duration / 60).toFixed(0); // Конвертируем в минуты
            const durationFeature = new Feature({
              geometry: new Point(middlePointCoord), // Используем ту же среднюю точку для времени
            });

            durationFeature.setStyle(new Style({
              text: new Text({
                text: `${durationInMinutes} min`,
                font: '12px Arial',
                fill: new Fill({
                  color: '#000',
                }),
                stroke: new Stroke({
                  color: '#fff',
                  width: 3,
                }),
                offsetY: -30, // Перемещаем метку над линией
              })
            }));

            labelSource.addFeature(durationFeature);
          }

          this.lineLayer = lineLayer;
          this.markerLayer = this.createMarkerLayer();

          // Добавляем слои линии и меток на карту
          this.map?.addLayer(this.lineLayer);
          this.map?.addLayer(this.markerLayer);
          this.map?.addLayer(labelLayer);
        });
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      const { latitude, longitude, layer } = GeoparksCoordsMap[this.activatedRoute.snapshot.params['geoparkId']];
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(layer, { featureProjection: 'EPSG:3857' }),
      });
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 1,
          }),
          fill: new Fill({
            color: 'blue',
          }),
        }),
      });
      this.map = new Map({
        layers: [
          new Tile({
            source: new OSM(),
          }),
          vectorLayer,
        ],
        target: 'map',
        view: new View({ 
          ...DEFAULT_EXTENT,
          center: fromLonLat([longitude, latitude]),
        }),
      });
    });
  }

  public createMarkerLayer(): VectorLayer<any> {
    const features: Feature<Point>[] = this.getFeatures(this.points);
    const markerLayer: VectorLayer<any> = new VectorLayer<any>({
      source: new VectorSource({
        features,
      }),
    });
    return markerLayer;
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
        image: new Icon({src: `../../../../assets/icons/${CommonTypeIconMap.get((point as GeoobjectModel).common_type)}`, scale: [0.45, 0.45]}),
      }));
      return feature;
    });
    return features;
  }
}
