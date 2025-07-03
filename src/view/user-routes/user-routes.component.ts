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
import { take, forkJoin } from 'rxjs';
import { IRoute, IRoutePoint, IRouteCache } from '@core';
import { OpenRouteService } from '../routes/services/open-route.service';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { openDB, IDBPDatabase } from 'idb';
import { TRouteCoordinates, TRouteProfile } from '../routes/interfaces/route-config.interface';

export const GeoparksCoordsMap: { [key: string]: { latitude: number; longitude: number; layer: any } } = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': { latitude: 55.2455, longitude: 58.2935, layer: YA_LAYER },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': {     latitude: 53.654764,
    longitude: 56.296764,
    layer: LAYER_TOROTAU, },
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

  // Общие маршруты с метриками
  public routes: RouteWithMetrics[] = [];
  // Пользовательские маршруты
  public routes_user: IRoute[] = [];

  public formattedDistance?: string;
  public formattedDuration?: string;
  public selectedProfile: TRouteProfile = 'foot-walking';
  public selectedRoute: RouteWithMetrics | undefined;

  private profiles: TRouteProfile[] = ['foot-walking', 'cycling-regular', 'driving-car'];
  private userId: string | null = null;

  public steepness_data: any[] = [];
  public isLegendShowed: boolean = false;
  public routeObjects: GeoobjectModel[] = [];
  public isObjectsShowed: boolean = false;
  public steepnessLegend: { color: string; label: string }[] = [
    { color: 'blue', label: 'Крутой спуск' },
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

  async ngOnInit(): Promise<void> {
<<<<<<< HEAD
  this.selectedSort = localStorage.getItem('userSort') || 'time-asc';
  const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
  const db = await this.getDb();

  // 1) читаем кеш только для текущего geopark
  let routes = await db
    .transaction('routes')
    .objectStore('routes')
    .index('byGeopark')
    .getAll(geoparkId) as IRoute[];

  const needFetch = !routes.length && navigator.onLine;
  if (needFetch) {
    try {
      // 2) фечим с сервера
      routes = await this.routeService
        .getRouteByGeoparkRouteSystemRoutesGeoparkIdGet(geoparkId)
        .pipe(take(1))
        .toPromise();

      // 3) чистим старые маршруты именно этого geoparkId
      const tx = db.transaction('routes', 'readwrite');
      const index = tx.objectStore('routes').index('byGeopark');
      const keys = await index.getAllKeys(geoparkId) as [string,string][];
      for (const key of keys) {
        tx.objectStore('routes').delete(key);
      }
      // 4) сохраняем новые — добавляем поле geoparkId в каждый объект
      for (const r of routes) {
        tx.objectStore('routes').put({ geoparkId, ...r });
      }
      await tx.done;

    } catch (err) {
      console.warn('Не удалось получить маршруты из API, остаёмся на кеше', err);
=======
    // Загружаем сортировку
    this.selectedSort = localStorage.getItem('userSort') || 'time-asc';

    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    // Общие маршруты
    this.routeService.getRouteByGeoparkRouteSystemRoutesGeoparkIdGet(geoparkId)
      .pipe(take(1))
      .subscribe(async (routes: IRoute[]) => {
        this.routes = routes as RouteWithMetrics[];
        await this.precacheRoutes(routes);
        await this.sortRoutes();
        this.initMap();
        this.showExtentForGeopark();
      });

    // Пользовательские маршруты
    this.userId = this.authAdminService.getCurrentUserId();
    if (this.userId) {
      this.loadUserRoutes();
>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86
    }
  }

  // 5) дальше ваш существующий pipeline
  this.routes = routes as RouteWithMetrics[];
  await this.precacheRoutes(this.routes);
  await this.sortRoutes();
  this.initMap();
  this.showExtentForGeopark();
  this.trackUsage('route-viewer');
}



  ngAfterViewInit(): void {}

  // Клонируем репозиторий для пользовательских маршрутов
  private loadUserRoutes(): void {
    this.clearMap();
    if (this.userId) {
      this.routeService.getRouteRouteUserUserIdGet(this.userId)
        .pipe(take(1))
        .subscribe(
          (routesq: IRoute[]) => {
            this.routes_user = routesq;
            this.precacheRoutes(routesq);
            this.initMap();
            this.showExtentForGeopark();
          },
          (error) => {
            console.error('Error fetching user routes:', error);
          }
        );
    }
  }

  private initMap(): void {
    // Инициализация или сброс карты
    this.clearMap();
    this.map = new Map({
      layers: [new Tile({ source: new OSM() })],
      target: 'map',
      view: new View({
        center: fromLonLat([55.958596, 54.735148]),
        zoom: 7,
      }),
    });
  }

  private clearMap(): void {
    if (this.map) {
      this.map.getLayers().clear();
      this.map.setTarget(null as any);
      this.map = undefined;
    }
  }

  private async precacheRoutes(routes: IRoute[]): Promise<void> {
    const db = await this.getDb();
    for (const route of routes) {
      for (const profile of this.profiles) {
        const existingCache = await db.get('routeCache', [route.id, profile]);
        if (!existingCache) {
          await this.cacheRouteData(route, profile);
        }
      }
    }
  }

  private async cacheRouteData(route: IRoute, profile: TRouteProfile): Promise<void> {
    const coordinates: TRouteCoordinates[] = route.route_points.map(p => [p.longitude, p.latitude] as TRouteCoordinates);
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
          steepness: res.steepness_data ?? []
        };
        await db.put('routeCache', cacheData);
      });
  }

  public async showRoute(route: RouteWithMetrics): Promise<void> {
    this.saveViewedRoute(route.id);

    this.selectedRoute = route;
    this.clearMapLayers();

    // Форматируем метрики
    if (route.metrics) {
      this.formatDistance(route.metrics.distance);
      this.formatDuration(route.metrics.duration);
    }

    // Загружаем из кеша или запрашиваем
    const db = await this.getDb();
    const cache = await db.get('routeCache', [route.id, this.selectedProfile]);
    if (cache) {
      this.processRouteData(cache.coordinates, cache.distance, cache.duration, cache.steepness || []);
      this.loadGeoObjects(route.route_points);
      this.fitMapToRoute(cache.coordinates);
    } else {
      await this.fetchAndCacheRoute(route);
    }
  }

  private async fetchAndCacheRoute(route: IRoute): Promise<void> {
    const coordinates: TRouteCoordinates[] = route.route_points.map(p => [p.longitude, p.latitude] as TRouteCoordinates);
    this.openRouteService.getRoute$({ coordinates, profile: this.selectedProfile })
      .pipe(take(1))
      .subscribe(async res => {
        const db = await this.getDb();
        const cacheData: IRouteCache = {
          routeId: route.id,
          profile: this.selectedProfile,
          coordinates: res.coordinates,
          distance: res.distance,
          duration: res.duration,
          steepness: res.steepness_data ?? []
        };
        await db.put('routeCache', cacheData);
        this.processRouteData(res.coordinates, res.distance, res.duration, res.steepness_data ?? []);
        this.loadGeoObjects(route.route_points);
        this.fitMapToRoute(res.coordinates);
      });
  }

  private processRouteData(coordinates: [number, number][], distance: number, duration: number, steepness_data: any[]): void {
    const segments: Feature<LineString>[] = [];
    const getColorForSteepness = (steepness: number): string => {
<<<<<<< HEAD
      if (steepness <= -5 || steepness === -4 ||steepness === -3)  return 'blue';
      if (steepness === -2 || steepness === -1 || steepness === 0) return 'green';
      if (steepness === 1 || steepness === 2) return 'orange';
      if (steepness >= 3) return 'red';
      return 'gray'; 
=======
      if (steepness <= -5 || steepness === -4) return 'blue';
      if (steepness === -3) return 'darkgreen';
      if (steepness >= -2 && steepness <= 0) return 'green';
      if (steepness >= 1 && steepness <= 3) return 'orange';
      if (steepness >= 4) return 'red';
      return 'gray';
>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86
    };
    steepness_data.forEach(([start, end, steep]) => {
      const segCoords = coordinates.slice(start, end + 1);
      const line = new LineString(segCoords).transform('EPSG:4326', 'EPSG:3857');
      const feature = new Feature({ geometry: line });
      feature.setStyle(new Style({ stroke: new Stroke({ color: getColorForSteepness(steep), width: 4 }) }));
      segments.push(feature);
    });

    this.lineLayer = new VectorLayer({
      source: new VectorSource({ features: segments }),
      style: new Style({ stroke: new Stroke({ color: 'black', width: 3 }) })
    });
    this.map?.addLayer(this.lineLayer);
    this.formatDistance(distance);
    this.formatDuration(duration);
  }

  private fitMapToRoute(coords: [number, number][]): void {
    if (!this.map || coords.length === 0) return;
    const transformed = coords.map(c => fromLonLat(c));
    const extent = new LineString(transformed).getExtent();
    this.map.getView().fit(extent, { duration: 1000, maxZoom: 12, padding: [50,50,50,50] });
  }

  public selectProfile(profile: TRouteProfile): void {
    if (this.selectedProfile !== profile) {
      this.clearMapLayers();
      this.selectedProfile = profile;
      if (this.selectedRoute) this.showRoute(this.selectedRoute as RouteWithMetrics);
    }
  }

  private loadGeoObjects(routePoints: IRoutePoint[]): void {
    if (this.markerLayer) this.map?.removeLayer(this.markerLayer);
    forkJoin(routePoints.map(p => this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(p.geoobject_id)))
      .subscribe(points => {
        this.routeObjects = points;
        const features = points.map((pt, i) => this.createFeature(pt, i));
        this.markerLayer = new VectorLayer({ source: new VectorSource({ features }) });
        this.map?.addLayer(this.markerLayer);
      });
  }

  private createFeature(point: GeoobjectModel, index: number): Feature<Point> {
    const feat = new Feature<Point>({ geometry: new Point(fromLonLat([point.longitude, point.latitude])) });
    feat.setStyle(new Style({
      text: new Text({ text: `${index+1}`, offsetY:20, font:'16px sans-serif' }),
      image: new Icon({ src: `../../../../assets/icons/${CommonTypeIconMap.get(point.common_type)}`, scale:[0.45,0.45] })
    }));
    return feat;
  }

  private formatDistance(distance: number): void {
    const km = Math.floor(distance/1000);
    const m = Math.round(distance%1000);
    this.formattedDistance = [km>0?`${km} км`:'', m>0?`${m} м`:''].filter(Boolean).join(' ')||'0 м';
  }

  private formatDuration(duration: number): void {
    const mins = Math.round(duration/60);
    const h = Math.floor(mins/60);
    const m = mins%60;
    this.formattedDuration = [h>0?`${h} ч`:'', m>0?`${m} мин`:''].filter(Boolean).join(' ')||'0 мин';
  }

  private clearMapLayers(): void {
    [this.lineLayer, this.markerLayer].forEach(l => {
      if (l) { l.getSource()?.clear(); this.map?.removeLayer(l); }
    });
    this.routeObjects = [];
  }

  private showExtentForGeopark(): void {
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    const data = GeoparksCoordsMap[geoparkId];
    if (data) {
      const layer = new VectorLayer({
        source: new VectorSource({ features: new GeoJSON().readFeatures(data.layer, { featureProjection:'EPSG:3857'}) }),
        style: new Style({ stroke: new Stroke({color:'red', width:1}), fill: new Fill({color:'rgba(0,0,255,0.1)'}) })
      });
<<<<<<< HEAD

      this.map?.setView(new View({
        center: fromLonLat([geoparkData.longitude, geoparkData.latitude]),
        zoom: 9.5
      }));
      this.map?.addLayer(vectorLayer);
=======
      this.map?.setView(new View({ center: fromLonLat([data.longitude,data.latitude]), zoom:9 }));
      this.map?.addLayer(layer);
>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86
    }
  }

  // GPX / KML export
  public downloadGPX(): void {
    if (!this.selectedRoute) return;
    const blob = this.buildGPXFromLonLat((this.selectedRoute as any).metricsCoordinates || [], this.selectedRoute.name, this.selectedRoute.description);
    this.downloadFile(blob, `${this.selectedRoute.name}.gpx`);
  }
  public downloadKML(): void {
    if (!this.selectedRoute) return;
    const blob = this.buildKMLFromLonLat((this.selectedRoute as any).metricsCoordinates || [], this.selectedRoute.name, this.selectedRoute.description);
    this.downloadFile(blob, `${this.selectedRoute.name}.kml`);
  }
  private buildGPXFromLonLat(coords: [number,number][], name: string, desc?: string): Blob {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MyApp" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${name}</name>${desc?`<desc>${desc}</desc>`:''}</metadata>
<trk><name>${name}</name><trkseg>
${coords.map(c=>`<trkpt lat="${c[1]}" lon="${c[0]}"/>`).join('\n')}
</trkseg></trk></gpx>`;
    return new Blob([xml], { type:'application/gpx+xml' });
  }
  private buildKMLFromLonLat(coords: [number,number][], name: string, desc?: string): Blob {
    const coordsText = coords.map(c=>`${c[0]},${c[1]},0`).join(' ');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
<name>${name}</name>${desc?`<description>${desc}</description>`:''}
<Style id="routeStyle"><LineStyle><color>7f0000ff</color><width>4</width></LineStyle></Style>
<Placemark><name>${name}</name>${desc?`<description>${desc}</description>`:''}
<styleUrl>#routeStyle</styleUrl><LineString><tessellate>1</tessellate>
<coordinates>${coordsText}</coordinates></LineString></Placemark>
</Document></kml>`;
    return new Blob([xml],{ type:'application/vnd.google-earth.kml+xml' });
  }
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  }

  public toggleLegend(): void { this.isLegendShowed = !this.isLegendShowed; }
  public toggleObjects(): void { this.isObjectsShowed = !this.isObjectsShowed; if(this.isObjectsShowed && this.selectedRoute && !this.routeObjects.length) this.loadGeoObjects(this.selectedRoute.route_points); }
  public openInYandexMaps(): void { if(!this.selectedRoute) return; const coords = this.selectedRoute.route_points.map(p=>`${p.latitude},${p.longitude}`).join('~'); window.open(`https://yandex.ru/maps/?rtext=${coords}&rtt=auto`,`_blank`); }

  private escapeXml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }

  private async sortRoutes(criteria?: string): Promise<void> {
    if (criteria) { this.selectedSort = criteria; localStorage.setItem('userSort', criteria); }
    if (!this.routes.length) return;
    await this.loadRoutesMetrics();
    const getVal = (r: RouteWithMetrics) => r.metrics ?? {distance:Infinity,duration:Infinity};
    this.routes = [...this.routes].sort((a,b) => {
      const av = getVal(a), bv = getVal(b);
      switch(this.selectedSort){
        case 'time-asc': return av.duration - bv.duration;
        case 'time-desc': return bv.duration - av.duration;
        case 'distance-asc': return av.distance - bv.distance;
        case 'distance-desc': return bv.distance - av.distance;
      }
      return 0;
    });
    if(this.selectedRoute){ const upd = this.routes.find(r=>r.id===this.selectedRoute?.id); if(upd){ this.clearMapLayers(); await this.showRoute(upd); }}
  }

  private async loadRoutesMetrics(): Promise<void> {
    const db = await this.getDb();
    for(const route of this.routes){ const cache = await db.get('routeCache',[route.id,this.selectedProfile]); if(cache){ route.metrics={distance:cache.distance,duration:cache.duration}; }}
  }

  onSortChanged(cr: string){ this.selectedSort=cr; this.sortRoutes(); }
  onShowRoute(r: IRoute){ this.selectedRoute = r as RouteWithMetrics; this.showRoute(this.selectedRoute); }

  private async getDb(): Promise<IDBPDatabase> {
<<<<<<< HEAD
  return openDB('RoutesDB', 5, {
    upgrade(db, oldVersion) {
      // 1) Всегда удаляем старый стор routes (и индекс в нём), если он есть
      if (db.objectStoreNames.contains('routes')) {
        db.deleteObjectStore('routes');
      }
      // 2) Создаём заново routes с keyPath = [geoparkId, id] и индексом byGeopark
      const routesStore = db.createObjectStore('routes', {
        keyPath: ['geoparkId', 'id']
      });
      routesStore.createIndex('byGeopark', 'geoparkId');

      if (!db.objectStoreNames.contains('routeCache')) {
        const cacheStore = db.createObjectStore('routeCache', {
          keyPath: ['routeId', 'profile']
        });
        cacheStore.createIndex('byRoute', 'routeId');
      }
    }
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
=======
    return openDB('RoutesDB', 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('routeCache')) {
          const store = db.createObjectStore('routeCache',{ keyPath:['routeId','profile'] });
          store.createIndex('byRoute','routeId');
        }
>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86
      }
    });
  }
<<<<<<< HEAD
  
  
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


  private saveViewedRoute(routeId: string): void {
  const existing = JSON.parse(localStorage.getItem('viewed_routes') || '[]');

  if (!existing.includes(routeId)) {
    existing.push(routeId);
    localStorage.setItem('viewed_routes', JSON.stringify(existing));
  }
}
private trackUsage(section: string): void {
  const geoparkId = this.activatedRoute.snapshot.params['geoparkId'] || 'global';
  const key = `usage_${geoparkId}`;
  const usage = JSON.parse(localStorage.getItem(key) || '{}');

  usage[section] = (usage[section] || 0) + 1;

  localStorage.setItem(key, JSON.stringify(usage));
}
}
=======
}
>>>>>>> 5ea7a60df049debe85e7254cb6416bf3858dcb86
