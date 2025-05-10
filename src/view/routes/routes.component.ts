import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Tile from 'ol/layer/Tile';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import View, { ViewOptions } from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import { get as getProjection } from 'ol/proj.js';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Feature } from 'ol';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text.js';

import { FormControl } from '@angular/forms';
import { Chart, Filler, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';

import { OpenRouteService, IRouteResult } from './services/open-route.service';
import { RouteCacheService } from './services/RouteCacheService.service';
import { WeatherService } from 'src/app/services/weather.service';
import { GeoobjectService, RouteService, GeoobjectModel, RoutePointPost } from '@api';
import { AuthAdminService, CommonTypeIconMap, YA_LAYER, LAYER_TOROTAU } from '@shared';
import { IPointGeoObject, AppRoutes } from '@core';
import { TRouteProfile, TRouteCoordinates } from './interfaces/route-config.interface';
import { SaveRouteDialogComponent } from './save-route-dialog/save-route-dialog.component';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

export const GeoparksCoordsMap: { [key: string]: { latitude: number; longitude: number; layer: any } } = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': { latitude: 55.2455, longitude: 58.2935, layer: YA_LAYER },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': { latitude: 53.554764, longitude: 56.096764, layer: LAYER_TOROTAU }
};

const DEFAULT_EXTENT: ViewOptions = {
  center: fromLonLat([55.958596, 54.735148]),
  zoom: 9,
  projection: getProjection('EPSG:3857')!
};

@Component({
  selector: 'geo-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss']
})
export class RoutesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() showRouteButtons = true;

  public map?: Map;
  public items: IPointGeoObject[] = [];
  public points: IPointGeoObject[] = [];
  public currentPoints: IPointGeoObject[] = [];
  public selectedProfile: TRouteProfile = 'foot-walking';
  public pointControl = new FormControl();

  public distance?: number;
  public duration?: number;
  public formattedDistance?: string;
  public formattedDuration?: string;

  public showElevationChart = false;
  private chart: Chart | null = null;

  public weatherData: any;
  public showWeatherInfo = false;

  private lineLayer?: VectorLayer<any>;
  private markerLayer?: VectorLayer<any>;
  private hoverMarkerLayer?: VectorLayer<any>;

  constructor(
    private openRouteService: OpenRouteService,
    private routeCacheService: RouteCacheService,
    private geoobjectService: GeoobjectService,
    private weatherService: WeatherService,
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private router: Router,
    private dialog: MatDialog,
    private authAdminService: AuthAdminService
  ) {}

  ngOnInit(): void {
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    this.geoobjectService.getGeoobjectsByGeoparkGeoobjectGeoparkGeoparkIdGet(geoparkId)
      .pipe(take(1))
      .subscribe((items: GeoobjectModel[]) => this.items = items);
    const { latitude, longitude } = GeoparksCoordsMap[geoparkId];
    this.weatherService.getWeather$(latitude, longitude)
      .pipe(take(1))
      .subscribe(data => this.weatherData = data);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
      const { latitude, longitude, layer } = GeoparksCoordsMap[geoparkId];

      const baseLayer = new Tile({ source: new OSM() });
      const parkLayer = new VectorLayer({
        source: new VectorSource({
          features: new GeoJSON().readFeatures(layer, { featureProjection: 'EPSG:3857' })
        }),
        style: new Style({
          stroke: new Stroke({ color: 'blue', width: 1 }),
          fill: new Fill({ color: 'rgba(0,0,255,0.1)' })
        })
      });

      this.map = new Map({
        target: 'map',
        layers: [baseLayer, parkLayer],
        view: new View({ ...DEFAULT_EXTENT, center: fromLonLat([longitude, latitude]) })
      });

      this.map.on('click', evt => {
        const [lon, lat] = toLonLat(evt.coordinate);
        const point: IPointGeoObject = {
          id: `click-${Date.now()}`,
          name: `Точка ${this.points.length + 1}`,
          latitude: lat,
          longitude: lon,
          common_type: 'user',
          geopark_id: geoparkId,
          type: 'user-defined'
        };
        this.onAddPoint(point);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  public onAddPoint(point: IPointGeoObject): void {
    this.points.push(point);
    this.currentPoints = [...this.points];
    this.calculateRoute();
  }

  public onDeletePoint(id: string): void {
    this.points = this.points.filter(p => p.id !== id);
    this.currentPoints = [...this.points];
    this.calculateRoute();
  }

  public onSaveRoute(): void {
    this.dialog.open(SaveRouteDialogComponent, { width: '300px' }).afterClosed()
      .pipe(take(1))
      .subscribe(name => {
        if (!name) return;
        const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
        const points: RoutePointPost[] = this.points.map((p, i) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          order: i,
          geoobject_id: p.id
        }));
        this.routeService.postRouteRoutePost({ route: { name }, points })
          .pipe(take(1))
          .subscribe(() => this.router.navigate([AppRoutes.MAIN]));
      });
  }

  public selectProfile(profile: TRouteProfile): void {
    if (this.selectedProfile !== profile) {
      this.selectedProfile = profile;
      this.calculateRoute();
    }
  }

  private calculateRoute(): void {
    this.clearLayers();
    if (this.points.length < 2) {
      this.markerLayer = this.createMarkerLayer();
      this.map?.addLayer(this.markerLayer!);
      return;
    }
    const coords: TRouteCoordinates[] = this.points.map(p => [p.longitude, p.latitude]);
    const cached = this.routeCacheService.getCachedRoute(coords, this.selectedProfile);
    const obs = cached
      ? of(cached)
      : this.openRouteService.getRoute$({ coordinates: coords, profile: this.selectedProfile }).pipe(take(1));
    obs.subscribe((res: IRouteResult) => {
      this.renderRoute(res);
      if (!cached) this.routeCacheService.cacheRoute(coords, this.selectedProfile, res);
      this.openRouteService.getElevation$({ coordinates: coords, profile: this.selectedProfile })
        .pipe(take(1))
        .subscribe(elevRes => {
          if (elevRes.formattedCoords) {
            this.createElevationChart(elevRes.formattedCoords);
          }
        });
    });
  }

  private clearLayers(): void {
    [this.lineLayer, this.markerLayer, this.hoverMarkerLayer].forEach(layer => {
      if (layer) this.map?.removeLayer(layer);
    });
  }

  private renderRoute(res: IRouteResult): void {
    console.log('❇️ River res.coordinates length:', res.coordinates.length);
    console.log('First 5 coords:', res.coordinates.slice(0, 5));
    if (!res.coordinates || res.coordinates.length === 0) {
      console.warn('Водный маршрут не найден или нет координат');
      return;
    }
   
  
    const coords3857 = (res.coordinates as [number,number][]).map(([lon, lat]) => fromLonLat([lon, lat]));
    const line = new LineString(coords3857);
    this.lineLayer = new VectorLayer({
      source: new VectorSource({ features: [new Feature({ geometry: line })] }),
      style: new Style({ stroke: new Stroke({ color: 'red', width: 3 }) })
    });
    this.map?.addLayer(this.lineLayer);

    this.distance = res.distance;
    this.duration = res.duration;
    this.formattedDistance = this.formatDistance(this.distance!);
    this.formattedDuration = this.formatDuration(this.duration!);

    this.markerLayer = this.createMarkerLayer();
    this.map?.addLayer(this.markerLayer!);
  }

  private createMarkerLayer(): VectorLayer<any> {
    const features = this.points.map((p, i) => {
      const feat = new Feature({ geometry: new Point(fromLonLat([p.longitude, p.latitude])) });
      feat.setId(p.id);
      const iconName = 'pin-map.png';
      feat.setStyle(new Style({
        image: new Icon({ src: `assets/icons/${iconName}`, scale: 0.05 })
      }));
      return feat;
    });
    return new VectorLayer({ source: new VectorSource({ features }) });
  }

  private formatDistance(m: number): string {
    const km = Math.floor(m / 1000);
    const mt = Math.round(m % 1000);
    return km > 0 ? `${km} км ${mt} м` : `${mt} м`;
  }

  private formatDuration(sec: number): string {
    const mins = Math.round(sec / 60);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs} ч ${m} мин` : `${m} мин`;
  }

  public toggleElevationChart(): void {
    this.showElevationChart = !this.showElevationChart;
  }

  public toggleWeather(): void {
    this.showWeatherInfo = !this.showWeatherInfo;
  }

  private createElevationChart(coords: number[][]): void {
    const canvas = document.getElementById('elevationChart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    const elevs = coords.map(c => c[2]);
    const base = elevs[0];
    const data = elevs.map(e => e - base);
    const labels = coords.map((_, i) => ((i * (this.distance! / coords.length) / 1000)).toFixed(1));

    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Высота (м)', data, fill: true }] },
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { title: ([item]) => `${item.label} км`, label: ctx => `Высота: ${ctx.parsed.y.toFixed(1)} м` } }
        },
        scales: { x: { title: { display: true, text: 'Расстояние (км)' } }, y: { title: { display: true, text: 'Высота (м)' }, beginAtZero: true } }
      }
    });
  }
}