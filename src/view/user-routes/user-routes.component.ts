import { Component, OnInit, AfterViewInit } from '@angular/core';
import { YA_LAYER, LAYER_TOROTAU, AuthAdminService, CommonTypeIconMap } from '@shared';
import Map from 'ol/Map';
import { FormControl } from '@angular/forms';
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
import { take, forkJoin } from 'rxjs';
import { IRoute, IRoutePoint, IRouteCache } from '@core';
import { OpenRouteService } from '../routes/services/open-route.service';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { openDB, IDBPDatabase } from 'idb';
import { TRouteCoordinates, TRouteProfile } from '../routes/interfaces/route-config.interface';

export const GeoparksCoordsMap: { [key: string]: { latitude: number, longitude: number, layer: any } } = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': { latitude: 55.2455, longitude: 58.2935, layer: YA_LAYER },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': { latitude: 53.554764, longitude: 56.096764, layer: LAYER_TOROTAU },
};

interface RouteMetrics {
    distance: number;
    duration: number;
}

interface RouteWithMetrics extends IRoute {
  metrics?: RouteMetrics;
  formattedDistance?: string;
  formattedDuration?: string;
}

@Component({
  selector: 'geo-user-routes',
  templateUrl: './user-routes.component.html',
  styleUrls: ['./user-routes.component.scss']
})
export class UserRoutesComponent implements OnInit, AfterViewInit {
  public map: Map | undefined;
  public lineLayer: VectorLayer<any> | undefined;
  public markerLayer: VectorLayer<any> | undefined;
  public routes: RouteWithMetrics[] = [];
  public formattedDistance?: string;
  public formattedDuration?: string;
  public selectedProfile: TRouteProfile = 'foot-walking';
  public selectedRoute: RouteWithMetrics | undefined;
  private profiles: TRouteProfile[] = ['foot-walking', 'cycling-regular', 'driving-car'];
  public steepness_data: any[] | undefined;
  public isLegendShowed: boolean = false;
  public routeObjects: GeoobjectModel[] = [];
  public isObjectsShowed: boolean = false;
  public steepnessLegend: { color: string, label: string }[] = [
    { color: 'blue', label: 'Крутой спуск' },
    { color: 'darkgreen', label: 'Легкий спуск' },
    { color: 'green', label: 'Ровные участки' },
    { color: 'orange', label: 'Легкий подъем' },
    { color: 'red', label: 'Крутой подъем' },
    { color: 'gray', label: 'Неизвестно' }
  ];

  public sortOptions = [
    { value: 'time-asc', label: 'По времени (возрастание)' },
    { value: 'time-desc', label: 'По времени (убывание)' },
    { value: 'distance-asc', label: 'По расстоянию (возрастание)' },
    { value: 'distance-desc', label: 'По расстоянию (убывание)' }
  ];
  public selectedSort: string = 'time-asc';

  constructor(
    private activatedRoute: ActivatedRoute,
    private routeService: RouteService,
    private authAdminService: AuthAdminService,
    private openRouteService: OpenRouteService,
    private geoobjectService: GeoobjectService
  ) {}

  getObjectsPanelTop(): number {
    return this.isLegendShowed && this.isObjectsShowed ? 200 : 70;
  }

  async ngOnInit(): Promise<void> {
    this.selectedSort = localStorage.getItem('userSort') || 'time-asc';
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    this.routeService.getRouteByGeoparkRouteSystemRoutesGeoparkIdGet(geoparkId)
      .pipe(take(1))
      .subscribe(async (routes: IRoute[]) => {
        this.routes = routes as RouteWithMetrics[];
        await this.precacheRoutes(routes);
        await this.sortRoutes();
        this.initMap();
        this.showExtentForGeopark();
      });
  }

  ngAfterViewInit(): void {}

  private initMap(): void {
    this.map = new Map({
      layers: [new Tile({ source: new OSM() })],
      target: 'map',
      view: new View({
        center: fromLonLat([55.958596, 54.735148]),
        zoom: 7,
      }),
    });
  }

  private async precacheRoutes(routes: IRoute[]): Promise<void> {
    const db = await this.getDb();
    
    for (const route of routes) {
      for (const profile of this.profiles) {
        const existingCache = await db.get('routeCache', [route.id, profile]);
        if (!existingCache) {
          await this.cacheRouteData(route, profile); // <-- ЖДЁМ
        }
      }
    }
    
  }

  private async cacheRouteData(route: IRoute, profile: TRouteProfile): Promise<void> {
    const coordinates: TRouteCoordinates[] = route.route_points.map(p => 
      [p.longitude, p.latitude] as TRouteCoordinates
    );
    
    this.openRouteService.getRoute$({ coordinates, profile })
      .pipe(take(1))
      .subscribe(async res => {
        const db = await this.getDb();
        const cacheData: IRouteCache = {
          routeId: route.id,
          profile,
          coordinates: res.coordinates,
          distance: res.distance,
          duration: res.duration,
          stepness: res.steepness_data ?? [] 
        };
        await db.put('routeCache', cacheData);
      });
  }

  public async showRoute(route: RouteWithMetrics): Promise<void> {
    this.selectedRoute = route;
    
    this.clearMapLayers();

    const metrics = route.metrics;
    if (metrics) {
      this.formatDistance(metrics.distance);
      this.formatDuration(metrics.duration);
    }
    this.routeObjects = [];
    this.isObjectsShowed = false;
  
    const db = await this.getDb();
    const cache = await db.get('routeCache', [route.id, this.selectedProfile]);
  
    if (cache) {
      this.fullCoordinates = cache.coordinates;
      this.processRouteData(cache.coordinates, cache.distance, cache.duration, cache.steepness);
      this.loadGeoObjects(route.route_points);
      this.fitMapToRoute(cache.coordinates);
    } else {
      this.fetchAndCacheRoute(route);
    }
  }

  private fitMapToRoute(coordinates: [number, number][]): void {
    if (!this.map || coordinates.length === 0) return;
  
    const transformedCoords = coordinates.map(coord => fromLonLat(coord));
    const extent = new LineString(transformedCoords).getExtent();
  
    this.map.getView().fit(extent, {
      duration: 1000, 
      maxZoom: 12, 
      padding: [50, 50, 50, 50] 
    });
  }

  private async fetchAndCacheRoute(route: IRoute): Promise<void> {
    const coordinates: TRouteCoordinates[] = route.route_points.map(p => 
      [p.longitude, p.latitude] as TRouteCoordinates
    );
    
    this.openRouteService.getRoute$({ 
      coordinates, 
      profile: this.selectedProfile 
    }).pipe(take(1)).subscribe(async res => {
      const db = await this.getDb();
      const cacheData: IRouteCache = {
        routeId: route.id,
        profile: this.selectedProfile,
        coordinates: res.coordinates,
        distance: res.distance,
        duration: res.duration,
        stepness: res.steepness_data ?? [] 
      };
      await db.put('routeCache', cacheData);
      this.fullCoordinates = res.coordinates;
      this.processRouteData(res.coordinates, res.distance, res.duration, res.steepness_data ?? []);
      this.loadGeoObjects(route.route_points);
    });
  }

  private processRouteData(coordinates: TRouteCoordinates[], distance: number, duration: number, steepness_data: any[]): void {
    const segments: Feature<LineString>[] = [];
    
    const getColorForSteepness = (steepness: number): string => {
      if (steepness <= -5 || steepness === -4) return 'blue';
      if (steepness === -3) return 'darkgreen';
      if (steepness === -2 || steepness === -1 || steepness === 0) return 'green';
      if (steepness === 1 || steepness === 2 || steepness === 3) return 'orange';
      if (steepness >= 4) return 'red';
      return 'gray'; 
    };

    steepness_data.forEach(([startIndex, endIndex, steepness]) => {
      const segmentCoords = coordinates.slice(startIndex, endIndex + 1);
      const segmentLineString = new LineString(segmentCoords).transform('EPSG:4326', 'EPSG:3857');

      const segmentFeature = new Feature<LineString>({ 
        geometry: segmentLineString as LineString 
      });
  
      segmentFeature.setStyle(new Style({
        stroke: new Stroke({
          color: getColorForSteepness(steepness),
          width: 4
        })
      }));

      segments.push(segmentFeature);
    });

    this.lineLayer = new VectorLayer({
      source: new VectorSource({ features: segments }),
      style: new Style({
        stroke: new Stroke({
          color: 'black',  
          width: 3
        })
      })
    });

    this.map?.addLayer(this.lineLayer);
    this.formatDistance(distance);
    this.formatDuration(duration);
  }

  public async selectProfile(profile: TRouteProfile): Promise<void> {
    if (this.selectedProfile !== profile) {
      this.clearMapLayers();
      this.selectedProfile = profile;
      // await this.sortRoutes();
      if (this.selectedRoute) {
        this.clearMapLayers();
        await this.showRoute(this.selectedRoute);
      }
    }
  }

  private loadGeoObjects(routePoints: IRoutePoint[]): void {
    if (this.markerLayer) {
      this.map?.removeLayer(this.markerLayer); // удаляем старые маркеры
    }
    forkJoin(routePoints.map(p => 
      this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(p.geoobject_id)
    )).subscribe(points => {
      this.routeObjects = points;
      
      const features = points.map((point, index) => this.createFeature(point, index));
      this.markerLayer = new VectorLayer({ source: new VectorSource({ features }) });
      this.map?.addLayer(this.markerLayer);
    });
  }

  private createFeature(point: GeoobjectModel, index: number): Feature<Point> {
    const feature = new Feature<Point>({
      geometry: new Point(fromLonLat([point.longitude, point.latitude])),
      ...point
    });
    
    feature.setStyle(new Style({
      text: new Text({
        text: `${index + 1}`,
        offsetY: 20,
        font: '16px sans-serif'
      }),
      image: new Icon({ 
        src: `../../../../assets/icons/${CommonTypeIconMap.get(point.common_type)}`, 
        scale: [0.45, 0.45] 
      }),
    }));
    
    return feature;
  }

  private formatDistance(distance: number): void {
    const km = Math.floor(distance / 1000);
    const meters = Math.round(distance % 1000);
    this.formattedDistance = [km > 0 ? `${km} км` : '', meters > 0 ? `${meters} м` : '']
      .filter(Boolean).join(' ') || '0 м';
  }

  private formatDuration(duration: number): void {
    const totalMinutes = Math.round(duration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    this.formattedDuration = [hours > 0 ? `${hours} ч` : '', minutes > 0 ? `${minutes} мин` : '']
      .filter(Boolean).join(' ') || '0 мин';
  }

  private clearMapLayers(): void {
    [this.lineLayer, this.markerLayer].forEach(layer => {
      
      if (layer) {
        layer.getSource()?.clear(); // <- добавляем это
        this.map?.removeLayer(layer);
      }
    });
    this.routeObjects = [];
  }

  private showExtentForGeopark(): void {
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    const geoparkData = GeoparksCoordsMap[geoparkId];

    if (geoparkData) {
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: new GeoJSON().readFeatures(geoparkData.layer, { 
            featureProjection: 'EPSG:3857' 
          }),
        }),
        style: new Style({
          stroke: new Stroke({ color: 'red', width: 1 }),
          fill: new Fill({ color: 'rgba(0, 0, 255, 0.1)' }),
        }),
      });

      this.map?.setView(new View({
        center: fromLonLat([geoparkData.longitude, geoparkData.latitude]),
        zoom: 9
      }));
      this.map?.addLayer(vectorLayer);
    }
  }

  private async getDb(): Promise<IDBPDatabase> {
    return openDB('RoutesDB', 3, {
      upgrade(db: IDBPDatabase) {
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
  
        if (!db.objectStoreNames.contains('routeCache')) {
          const store = db.createObjectStore('routeCache', { 
            keyPath: ['routeId', 'profile'] 
          });
          store.createIndex('byRoute', 'routeId'); // теперь TS не ругается
        }
      },
    });
  }
  

  public async sortRoutes(criteria?: string): Promise<void> {
    if (criteria) {
      this.selectedSort = criteria;
      localStorage.setItem('userSort', criteria);
    }
  
    if (!this.routes.length) return;
  
    await this.loadRoutesMetrics();
  
    const getMetricsValue = (route: RouteWithMetrics) => route.metrics ?? { distance: Infinity, duration: Infinity };
  
    this.routes = [...this.routes].sort((a, b) => {
      const aVal = getMetricsValue(a);
      const bVal = getMetricsValue(b);
  
      switch (this.selectedSort) {
        case 'time-asc': return aVal.duration - bVal.duration;
        case 'time-desc': return bVal.duration - aVal.duration;
        case 'distance-asc': return aVal.distance - bVal.distance;
        case 'distance-desc': return bVal.distance - aVal.distance;
        default: return 0;
      }
    });
  
    if (this.selectedRoute) {
      const updated = this.routes.find(r => r.id === this.selectedRoute?.id);
      if (updated) {
        this.clearMapLayers();
        await this.showRoute(updated);
      }
    }
  }
  
  
  private async loadRoutesMetrics(): Promise<void> {
    const db = await this.getDb();
  
    for (const route of this.routes) {
      const cache = await db.get('routeCache', [route.id, this.selectedProfile]);
      if (cache) {
        route.metrics = {
          distance: cache.distance,
          duration: cache.duration
        };
      }
    }
  }

  onSortChanged(criteria: string) {
    this.selectedSort = criteria;
    this.sortRoutes();
  }
  
  onShowRoute(route: IRoute) {
    this.selectedRoute = route;
    this.showRoute(route);
  }

  public toggleLegend(): void {
    this.isLegendShowed = !this.isLegendShowed;
  }
  
  public toggleObjects(): void {
    this.isObjectsShowed = !this.isObjectsShowed;
    if (this.isObjectsShowed && this.selectedRoute && this.routeObjects.length === 0) {
      this.loadGeoObjects(this.selectedRoute.route_points);
    }
  }

  private fullCoordinates: [number, number][] = [];
  downloadGPX(): void {
    if (!this.fullCoordinates.length || !this.selectedRoute) return;
    const blob = this.buildGPXFromLonLat(
      this.fullCoordinates,
      this.selectedRoute.name,
      this.selectedRoute.description
    );
    this.downloadFile(blob, `${this.selectedRoute.name}.gpx`);
  }

  // Экспорт KML
  downloadKML(): void {
    if (!this.fullCoordinates.length || !this.selectedRoute) return;
    const blob = this.buildKMLFromLonLat(
      this.fullCoordinates,
      this.selectedRoute.name,
      this.selectedRoute.description
    );
    this.downloadFile(blob, `${this.selectedRoute.name}.kml`);
  }

  // GPX из [lon,lat]
  private buildGPXFromLonLat(
    coords: [number, number][],
    routeName: string,
    description?: string
  ): Blob {
    const header = `<?xml version="1.0" encoding="UTF-8"?>`;
    const gpxOpen = `<gpx version="1.1" creator="MyApp"
      xmlns="http://www.topografix.com/GPX/1/1">`;
    const meta = [
      `<metadata>`,
      `  <name>${this.escapeXml(routeName)}</name>`,
      description ? `  <desc>${this.escapeXml(description)}</desc>` : ``,
      `</metadata>`
    ].join('\n');

    const trkseg = coords
      .map(([lon, lat]) => `  <trkpt lat="${lat}" lon="${lon}" />`)
      .join('\n');

    const trk = [
      `<trk>`,
      `  <name>${this.escapeXml(routeName)}</name>`,
      `  <trkseg>`,
      trkseg,
      `  </trkseg>`,
      `</trk>`
    ].join('\n');

    const xml = [header, gpxOpen, meta, trk, `</gpx>`].join('\n');
    return new Blob([xml], { type: 'application/gpx+xml' });
  }

  // KML из [lon,lat]
  private buildKMLFromLonLat(
    coords: [number, number][],
    routeName: string,
    description?: string
  ): Blob {
    const header = `<?xml version="1.0" encoding="UTF-8"?>`;
    const kmlOpen = `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>`;
    const nameTag = `<name>${this.escapeXml(routeName)}</name>`;
    const descTag = description
      ? `<description>${this.escapeXml(description)}</description>`
      : ``;
    const style = `
      <Style id="routeStyle">
        <LineStyle><color>7f0000ff</color><width>4</width></LineStyle>
      </Style>`.trim();

    const coordsText = coords
      .map(([lon, lat]) => `${lon},${lat},0`)
      .join(' ');

    const placemark = `
      <Placemark>
        <name>${this.escapeXml(routeName)}</name>
        ${descTag}
        <styleUrl>#routeStyle</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${coordsText}</coordinates>
        </LineString>
      </Placemark>
    `.trim();

    const xml = [
      header,
      kmlOpen,
      nameTag,
      descTag,
      style,
      placemark,
      `</Document></kml>`
    ].join('\n');

    return new Blob([xml], { type: 'application/vnd.google-earth.kml+xml' });
  }

  openInYandexMaps(): void {
    if (!this.selectedRoute) return;
    // Собираем rtext из списка точек
    const coords = this.selectedRoute.route_points
      .map(p => `${p.latitude},${p.longitude}`)
      .join('~');
    const url = `https://yandex.ru/maps/?rtext=${coords}&rtt=auto`;
    window.open(url, '_blank');
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }


}