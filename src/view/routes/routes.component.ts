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
import { OpenRouteService } from './services/open-route.service';
import LineString from 'ol/geom/LineString';
import { Feature } from 'ol';
import { GeoobjectModel, GeoobjectService, RoutePointPost, RouteService } from '@api';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { AppRoutes, IPointGeoObject } from '@core';
import { Point } from 'ol/geom';
import Icon from 'ol/style/Icon';
import { TRouteCoordinates, TRouteProfile } from './interfaces/route-config.interface';
import Text from 'ol/style/Text.js';
import { MatDialog } from '@angular/material/dialog';
import { SaveRouteDialogComponent } from './save-route-dialog/save-route-dialog.component';
import { FormControl } from '@angular/forms';
import { Chart,Filler ,LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { RouteCacheService } from './services/RouteCacheService.service';
import { WeatherService } from 'src/app/services/weather.service';
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

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
  public showWeatherInfo = false; 
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
  @Input() showRouteButtons: boolean = true;
  public ascent?: number;
  public descent?: number; 
  private chart: Chart | null = null;
  public showElevationChart = false;
  public long_user: number | null = null;
  public latit_user: number | null = null;
  public weatherData: any;
  constructor(
    private routeCacheService: RouteCacheService,
    private openRouteService: OpenRouteService,
    private geoobjectService: GeoobjectService,
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private router: Router,
    private dialog: MatDialog,
    private authAdminService: AuthAdminService,
    private weatherSerivce:  WeatherService,
    
  ) {}

  private hoverMarkerLayer: VectorLayer<any> | undefined = undefined;
  
  
  
  private createHoverMarker(latitude: number, longitude: number): void {
  
    // Удаляем предыдущий маркер, если он есть
    if (this.hoverMarkerLayer) {
      this.map?.removeLayer(this.hoverMarkerLayer);
    }
  
    // Создаем новую точку
    const hoverPoint = new Point(fromLonLat([longitude, latitude]));
  
    const hoverFeature = new Feature({
      geometry: hoverPoint,
    });
  
    hoverFeature.setStyle(new Style({
      image: new Icon({
        src: 'assets/icons/pin-map.png', // Укажите путь к иконке для местоположения пользователя
        scale: 0.05,
      }),
    }));
  
    this.hoverMarkerLayer = new VectorLayer({
      source: new VectorSource({
        features: [hoverFeature],
      }),
      zIndex: 1000, // Поднимаем слой маркера выше других слоев
    });
  
    // Добавляем маркер на карту
    this.map?.addLayer(this.hoverMarkerLayer);
    console.log('Hover marker added to the map'); // Логируем успешное добавление
  
    // Временно изменяем центр карты на координаты маркера
  }

  private addUserMarker(latitude: number, longitude: number): void {
    const userPoint = new Point(fromLonLat([longitude, latitude]));
  
    const userFeature = new Feature({
      geometry: userPoint,
    });
  
    userFeature.setStyle(new Style({
      image: new Icon({
        src: 'assets/icons/pin-map.png', // Укажите путь к иконке для местоположения пользователя
        scale: 0.05,
      }),
    }));
  
    const userMarkerLayer = new VectorLayer({
      source: new VectorSource({
        features: [userFeature],
      }),
    });
  
    this.map?.addLayer(userMarkerLayer);
  }

  public async ngOnInit(): Promise<void> {
    const geoparkId: string = this.activatedRoute.snapshot.params['geoparkId'];
    this.geoobjectService.getGeoobjectsByGeoparkGeoobjectGeoparkGeoparkIdGet(geoparkId).pipe(take(1)).subscribe((items: GeoobjectModel[]) => {
      this.items = items;
    });
    const { latitude, longitude } = GeoparksCoordsMap[this.activatedRoute.snapshot.params['geoparkId']];
    this.weatherSerivce.getWeather$(latitude, longitude).subscribe({
      next: (data: any) => {
        this.weatherData = data;
        console.log(this.weatherData);
      },
      error: (err: any) => {
        console.error('Ошибка загрузки погоды:', err);
      }
    });
    if('geolocation' in navigator){
      navigator.geolocation.getCurrentPosition((position) => {
        this.latit_user = position.coords.latitude;
        this.long_user = position.coords.longitude;
        this.addUserMarker  (this.latit_user,this.long_user);
      }
      )
    }
  }

  public onAddPoint(point: IPointGeoObject): void {
    this.points.push(point);
    this.currentPoints = [...this.points];
    this.calculateRoute();
  }

  public selectProfile(profile: TRouteProfile): void {
    if (this.selectedProfile !== profile) {
      this.selectedProfile = profile;
      this.calculateRoute();
    }
  }

  public addPointToRoute(): void {
    if (this.pointControl.value) {
      this.onAddPoint(this.pointControl.value);
      this.pointControl.reset();
    }
  }

  public deletePointFromRoute(id: string): void {
    this.onDeletePoint(id);
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
    this.currentPoints = [...this.points];  // Обновляем список точек
    this.calculateRoute();
  }


  public calculateRoute(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  
    if (this.markerLayer) {
      this.map?.removeLayer(this.markerLayer);
    }
  
    if (this.lineLayer) {
      this.map?.removeLayer(this.lineLayer);
    }
  
    if (this.points.length < 2) {
      this.markerLayer = this.createMarkerLayer();
      this.map?.addLayer(this.markerLayer);
      return;
    }
  
    const coordinates: TRouteCoordinates[] = this.points.map(point => [point.longitude, point.latitude]);
  
    // Проверяем кеш перед запросом
    const cachedRoute = this.routeCacheService.getCachedRoute(coordinates, this.selectedProfile);
    if (cachedRoute) {
      console.log('Маршрут найден в кеше:', cachedRoute);
      this.renderRoute(cachedRoute);
      this.openRouteService.getElevation$({ coordinates, profile: this.selectedProfile })
      .pipe(take(1))
      .subscribe((elevationRes) => {
        if (elevationRes?.formattedCoords?.length) {
          console.log('formattedCoords:', elevationRes.formattedCoords);

          this.createElevationChart(elevationRes.formattedCoords);
          
        }
      });
      return;
    }
  
    console.log('Маршрут не найден в кеше, запрашиваем API...');
  
    this.openRouteService.getRoute$({ coordinates, profile: this.selectedProfile })
      .pipe(take(1))
      .subscribe((res) => {
        if (res) {
          this.createElevationChart(res.coordinates);
          console.log('Маршрут получен, добавляем в кеш:', res);
          this.routeCacheService.cacheRoute(coordinates, this.selectedProfile, res);
          this.renderRoute(res);
        } else {
          console.warn('Не удалось получить маршрут!');
        }
      });
  
    this.openRouteService.getElevation$({ coordinates, profile: this.selectedProfile })
      .pipe(take(1))
      .subscribe(async (elevationRes) => {
        if (elevationRes?.formattedCoords?.length) {
          await this.createElevationChart(elevationRes.formattedCoords);
          
        }
      });
  }
  
  private renderRoute(res: any): void {
    const { coordinates: routeCoordinates, distance, duration, ascent, descent } = res;
  
    const lineStr: LineString = new LineString(routeCoordinates as any);
    lineStr.transform('EPSG:4326', 'EPSG:3857');
  
    const lineLayerSource = new VectorSource({
      features: [new Feature({ geometry: lineStr })]
    });
  
    const lineLayer: VectorLayer<any> = new VectorLayer({
      source: lineLayerSource,
      style: new Style({
        stroke: new Stroke({ color: 'red', width: 3 }),
      }),
    });
  
    this.distance = distance;
    this.duration = duration;
    this.formattedDistance = this.formatDistance(distance);
    this.formattedDuration = this.formatDuration(duration);
  
    this.lineLayer = lineLayer;
    this.markerLayer = this.createMarkerLayer();
  
    this.map?.addLayer(this.lineLayer);
    this.map?.addLayer(this.markerLayer);
  }
  
  private formatDistance(distance: number): string {
    const kilometers = Math.floor(distance / 1000);
    const meters = Math.round(distance % 1000);
  
    return kilometers > 0 ? `${kilometers} км ${meters > 0 ? meters + ' м' : ''}` : `${meters} м`;
  }
  
  private formatDuration(duration: number): string {
    const totalMinutes = Math.round(duration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    return hours > 0 ? `${hours} ч ${minutes > 0 ? minutes + ' мин' : ''}` : `${minutes} мин`;
  }
  
  public toggleElevationChart(): void {
    this.showElevationChart = !this.showElevationChart;
    this.calculateRoute();  
  }

  public toggleWeather() : void{
    this.showWeatherInfo = !this.showWeatherInfo;
  }
  

  private async createElevationChart(formattedCoords: number[][]): Promise<void> {
    const canvas = document.getElementById('elevationChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
  
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
  
    if (this.chart) {
      this.chart.destroy();
    }
  
    const elevations = formattedCoords.map(coord => coord[2]);
  
    const firstElevation = elevations[0];
  
    const relativeElevations = elevations.map(elevation => elevation - firstElevation);
  
    const labels = formattedCoords.map((coord, index) => {
      const jio = (index * this.distance! / formattedCoords.length / 1000).toFixed(1);
      return jio;
    });
  
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Высота (м)',
          data: relativeElevations, 
          borderColor: "#305C3F",
          fill: true,
          backgroundColor: 'rgba(48, 92, 63, 0.2)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Профиль высот маршрута'
          },
          tooltip: {
            callbacks: {
              label: (context) => `Высота: ${context.parsed.y.toFixed(1)} м`,
              title: (items) => `${items[0].label} км`
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Расстояние (км)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Высота (м)'
            },
            beginAtZero: true 
          }
        },
        onHover: (event: any, chartElement: any) => {
          if (chartElement.length > 0) {
            const index = chartElement[0].index;
            const coordinates = formattedCoords[index];
            this.createHoverMarker(coordinates[0], coordinates[1]);
          }
        }
      },
      plugins: [{
        id: 'hoverPlugin',
        afterEvent: (chart: any, args: any) => {
          const event = args.event;
          if (event.type === 'mouseout') {
            if (this.hoverMarkerLayer) {
              this.map?.removeLayer(this.hoverMarkerLayer);
              this.hoverMarkerLayer = undefined;
            }
          }
        }
      }]
    });
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
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
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