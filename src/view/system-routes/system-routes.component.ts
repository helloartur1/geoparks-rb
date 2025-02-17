import { Component, Input } from '@angular/core';
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
// import LineString from 'ol/geom/LineString';
import { Feature } from 'ol';
import { GeoobjectModel, GeoobjectService, RoutePointPost, RouteService } from '@api';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { AppRoutes, IPointGeoObject } from '@core';
import { Point } from 'ol/geom';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text.js';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { TRouteProfile } from '../routes/interfaces/route-config.interface';
import { OpenRouteService } from '../routes/services/open-route.service';

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
  selector: 'geo-system-routes',
  templateUrl: './system-routes.component.html',
  styleUrls: ['./system-routes.component.scss']
})
export class SystemRoutesComponent {

  public map: Map | undefined = undefined;
  public route: Array<[number, number]> | undefined = undefined;
  public items: IPointGeoObject[] = [];
  public lineLayer: VectorLayer<any> | undefined = undefined;
  public markerLayer: VectorLayer<any> | undefined = undefined;
  public points: IPointGeoObject[] = [];
  public currentPoints: IPointGeoObject[] = [];  // Для отображения в списке точек
  public formattedDistance?: string;
  public formattedDuration?: string;
  public distance: number | undefined = undefined;
  public duration: number | undefined = undefined;
  public selectedProfile: TRouteProfile = 'foot-walking';
  public pointControl = new FormControl();
  @Input() showRouteButtons: boolean = false;
  constructor(
    private openRouteService: OpenRouteService,
    private geoobjectService: GeoobjectService,
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private router: Router,
    private dialog: MatDialog,
    private authAdminService: AuthAdminService
  ) {}

  public ngOnInit(): void {

    const geoparkId: string = this.activatedRoute.snapshot.params['geoparkId'];
    this.geoobjectService.getGeoobjectsByGeoparkGeoobjectGeoparkGeoparkIdGet(geoparkId).pipe(take(1)).subscribe((items: GeoobjectModel[]) => {
      this.items = items;
    });
  }

  public ngAfterViewInit(): void {
    this.showRouteButtons = false;
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
