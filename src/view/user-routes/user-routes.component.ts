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
    public routes: IRoute[] = [];  
    public routes_user: IRoute[] = [];  
    public formattedDistance?: string;  
    public formattedDuration?: string;  
    public selectedProfile: TRouteProfile = 'foot-walking';  
    public selectedRoute: IRoute | undefined;  
    private profiles: TRouteProfile[] = ['foot-walking', 'cycling-regular', 'driving-car'];  
    private userId: string | null = null;  

    constructor(  
        private activatedRoute: ActivatedRoute,  
        private routeService: RouteService,  
        private authAdminService: AuthAdminService,  
        private openRouteService: OpenRouteService,  
        private geoobjectService: GeoobjectService  
    ) {}  

    async ngOnInit(): Promise<void> {  
        const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];  
        this.routeService.getRouteByGeoparkRouteSystemRoutesGeoparkIdGet(geoparkId)  
            .pipe(take(1))  
            .subscribe(async (routes: IRoute[]) => {  
                this.routes = routes;  
                await this.precacheRoutes(routes);  
                this.initMap();  
                this.showExtentForGeopark();  
            });  
        this.userId = this.authAdminService.getCurrentUserId();  
        if (this.userId) {  
            this.loadUserRoutes();  
        } else {  
            console.error('User ID is not available');  
        }  
    }  

    ngAfterViewInit(): void {  
        // this.initMap();  
        // this.showExtentForGeopark();  
    }  

    private clearMap(): void {
      if (this.map) {
        this.map.getLayers().clear();
          this.map.setTarget('null'); // Удаляем карту
          this.map = undefined;
          console.log('Map cleared'); // Отладочный вывод
      }
  }
  

    private initMap(): void {  
        console.log('Initializing map'); // Отладочный вывод 
        if (this.map) {
          this.clearMap();
      } 
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

        routes.forEach(route => {  
            this.profiles.forEach(async profile => {  
                const existingCache = await db.get('routeCache', [route.id, profile]);  
                if (!existingCache) {  
                    this.cacheRouteData(route, profile);  
                }  
            });  
        });  
    }  

    private loadUserRoutes(): void {  
        if (this.userId) {  
            this.clearMap();
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
                        console.error('Error fetching user routes:', error); // Отладочный вывод  
                        if (error.status === 401) { // Ошибка авторизации  
                            console.error('Unauthorized:', error);  
                            // Перенаправьте пользователя на страницу авторизации  
                        }  
                    }  
                );  
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
                    duration: res.duration  
                };  
                console.log('Caching route data:', cacheData); // Отладочный вывод  
                await db.put('routeCache', cacheData);  
            });  
    }  

    private clearMapLayers(): void {  
        [this.lineLayer, this.markerLayer].forEach(layer => {  
            if (layer) this.map?.removeLayer(layer);  
        });  
    }  

    public async showRoute(route: IRoute): Promise<void> {  
        this.selectedRoute = route;  
        this.clearMapLayers();  
        console.log("OK show");  

        const db = await this.getDb();  
        const cache = await db.get('routeCache', [route.id, this.selectedProfile]);  

        if (cache) {  
            this.processRouteData(cache.coordinates, cache.distance, cache.duration);  
            this.loadGeoObjects(route.route_points);  
        } else {  
            this.fetchAndCacheRoute(route);  
        }  
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
                duration: res.duration  
            };  
            await db.put('routeCache', cacheData);  
            this.processRouteData(res.coordinates, res.distance, res.duration);  
            this.loadGeoObjects(route.route_points);  
        });  
    }  

    private processRouteData(coordinates: TRouteCoordinates[], distance: number, duration: number): void {  
        const lineString = new LineString(coordinates).transform('EPSG:4326', 'EPSG:3857');  

        this.lineLayer = new VectorLayer({  
            source: new VectorSource({ features: [new Feature({ geometry: lineString })] }),  
            style: new Style({ stroke: new Stroke({ color: 'red', width: 3 }) }),  
        });  

        this.map?.addLayer(this.lineLayer);  
        this.formatDistance(distance);  
        this.formatDuration(duration);  
    }  

    public selectProfile(profile: TRouteProfile): void {  
        if (this.selectedProfile !== profile) {  
            this.selectedProfile = profile;  
            if (this.selectedRoute) {  
                this.showRoute(this.selectedRoute);  
            }  
        }  
    }  

    private loadGeoObjects(routePoints: IRoutePoint[]): void {  
        console.log('Loading geo objects:', routePoints); // Отладочный вывод  
        forkJoin(routePoints.map(p =>  
            this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(p.geoobject_id)  
        )).subscribe(points => {  
            console.log('Geo objects loaded:', points); // Отладочный вывод  
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
          text: new Text({ // Create a Text object
              text: `${index + 1}. ${point.name}`,  
              offsetY: 20,  
              font: '10px sans-serif'
          })
      }));
        

        feature.setStyle(new Style({  
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
            upgrade(db) {  
                if (!db.objectStoreNames.contains('routes')) {  
                    db.createObjectStore('routes', { keyPath: 'id' });  
                }  
                if (!db.objectStoreNames.contains('routeCache')) {  
                    const store = db.createObjectStore('routeCache', {  
                        keyPath: ['routeId', 'profile']  
                    });  
                    store.createIndex('byRoute', 'routeId');  
                }  
            },  
        });  
    }  
}  