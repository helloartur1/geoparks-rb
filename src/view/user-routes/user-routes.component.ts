import { Component, OnInit, AfterViewInit } from '@angular/core';
import { YA_LAYER, LAYER_TOROTAU, AuthAdminService, CommonTypeIconMap } from '@shared';
import Map from 'ol/Map';
import View from 'ol/View';
import Tile from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import Icon from 'ol/style/Icon';
import { ActivatedRoute } from '@angular/router';
import { GeoobjectModel, GeoobjectService, RouteService } from '@api';
import { take, forkJoin, Observable } from 'rxjs';
import { IPointGeoObject, IRoute, IRoutePoint } from '@core';
import { OpenRouteService } from '../routes/services/open-route.service';
import { TRouteCoordinates, TRouteProfile } from '../routes/interfaces/route-config.interface';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';


export const GeoparksCoordsMap: { [key: string]: { latitude: number, longitude: number, layer: any } } = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': { latitude: 55.2455, longitude: 58.2935, layer: YA_LAYER },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': { latitude: 53.554764, longitude: 56.096764, layer: LAYER_TOROTAU },
};

@Component({
  selector: 'geo-user-routes',
  templateUrl: './user-routes.component.html',
  styleUrls: ['./user-routes.component.scss']
})
export class UserRoutesComponent implements OnInit, AfterViewInit {
  public map: Map | undefined;
  public lineLayer: VectorLayer<any> | undefined;
  public markerLayer: VectorLayer<any> | undefined;
  public routes: Array<IRoute> = [];
  public formattedDistance?: string;
  public formattedDuration?: string;
  public selectedProfile: TRouteProfile = 'foot-walking';
  public selectedRoute: IRoute | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private authAdminService: AuthAdminService,
    private openRouteService: OpenRouteService,
    private geoobjectService: GeoobjectService
  ) {}

  ngOnInit(): void {
    const geoparkId: string = this.activatedRoute.snapshot.params['geoparkId'];
    this.routeService.getRouteByGeoparkRouteSystemRoutesGeoparkIdGet(geoparkId)
      .pipe(take(1))
      .subscribe((routes: any) => {
        this.routes = routes;
      });
    console.log(geoparkId);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.map = new Map({
        layers: [new Tile({ source: new OSM() })],
        target: 'map',
        view: new View({
          center: fromLonLat([55.958596, 54.735148]),
          zoom: 7,
        }),
      });
      this.showExtentForGeopark();
    });
  }

  showExtentForGeopark(): void {
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    const geoparkData = GeoparksCoordsMap[geoparkId];

    if (geoparkData) {
      const { latitude, longitude, layer } = geoparkData;

      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(layer, { featureProjection: 'EPSG:3857' }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({ color: 'red', width: 1 }),
          fill: new Fill({ color: 'rgba(0, 0, 255, 0.1)' }),
        }),
      });

      this.map?.getView().setCenter(fromLonLat([longitude, latitude]));
      this.map?.getView().setZoom(9);
      this.map?.addLayer(vectorLayer);
    }
  }

  public selectProfile(profile: TRouteProfile): void {
    if (this.selectedProfile !== profile) {
      this.selectedProfile = profile;
      if (this.selectedRoute) {
        this.showRoute(this.selectedRoute);
      }
    }
  }

  public showRoute(route: IRoute): void {
    this.selectedRoute = route;

    if (this.markerLayer) this.map?.removeLayer(this.markerLayer);
    if (this.lineLayer) this.map?.removeLayer(this.lineLayer);

    const coordinates: TRouteCoordinates[] = route.route_points.map(point => [point.longitude, point.latitude]);

    this.openRouteService.getRoute$({ coordinates, profile: this.selectedProfile })
      .pipe(take(1))
      .subscribe((res) => {
        const { coordinates: routeCoordinates, distance, duration } = res;

        const lineStr = new LineString(routeCoordinates as any).transform('EPSG:4326', 'EPSG:3857') as LineString;

        this.lineLayer = new VectorLayer({
          source: new VectorSource({ features: [new Feature({ geometry: lineStr })] }),
          style: new Style({ stroke: new Stroke({ color: 'red', width: 3 }) }),
        });

        const labelSource = new VectorSource();
        const labelLayer = new VectorLayer({ source: labelSource });
        const middlePointCoord = lineStr.getCoordinateAt(0.5);
        // this.formattedDistance = (distance / 1000).toFixed(2);

        this.map?.addLayer(this.lineLayer);
        this.map?.addLayer(labelLayer);

        let kilometers = Math.floor(distance / 1000); 
            let meters = Math.round((distance % 1000)); 

            if (kilometers > 0) {
                this.formattedDistance = kilometers + ' км';
                if (meters > 0) {
                    this.formattedDistance += ' ' + meters + ' м';
                }
            } else if (meters > 0) {
                this.formattedDistance = meters + ' м';
            } else {
                this.formattedDistance = '0 м'; 
            }

        let totalMinutes = Math.round(duration / 60);
        let hours = Math.floor(totalMinutes / 60);
        let minutes = totalMinutes % 60;

        if (hours > 0) {
          this.formattedDuration = hours + ' ч';
          if (minutes > 0) {
            this.formattedDuration += ' ' + minutes + ' мин';
          }
        } else if (minutes > 0) {
          this.formattedDuration = minutes + ' мин';
        } else {
          this.formattedDuration = '0 мин';
        }

        const geeoobjectsStreams$: Array<Observable<GeoobjectModel>> = route.route_points.map(point =>
          this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(point.geoobject_id)
        );

        forkJoin(geeoobjectsStreams$)
          .pipe(take(1))
          .subscribe((points: IPointGeoObject[]) => {
            const features = this.getFeatures(points);
            this.markerLayer = new VectorLayer({ source: new VectorSource({ features }) });
            this.map?.addLayer(this.markerLayer);
          });
      });
  }

  private getFeatures(points: IPointGeoObject[]): Feature<Point>[] {
    return points.map((point, index) => {
      const feature = new Feature<Point>({
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
        image: new Icon({ src: `../../../../assets/icons/${CommonTypeIconMap.get((point as GeoobjectModel).common_type)}`, scale: [0.45, 0.45] }),
      }));
      return feature;
    });
  }
}
