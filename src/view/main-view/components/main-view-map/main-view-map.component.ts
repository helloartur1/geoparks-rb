import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CoordinatesType, IGeoObjectFilterFields, IGeopark, IPointGeoObject } from '@core';
import { CommonTypeIconMap, LayerByIdMap, MarkerInfoModalComponent, TypeIconMap } from '@shared';
import Map from 'ol/Map';
import View, { ViewOptions } from 'ol/View';
import { Point } from 'ol/geom';
import Tile from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { MatDialog } from '@angular/material/dialog';
import { fromLonLat } from 'ol/proj';
import { GeoobjectModel } from '@api';
import GeoJSON from 'ol/format/GeoJSON';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { MapCacheService } from './map-cache.service';

interface MapState {
  center: number[];
  zoom: number;
  timestamp: number;
  geoparkId: string;
}

const DEFAULT_EXTENT: ViewOptions = {
  center: fromLonLat([51.155889, 55.179724]),
  zoom: 9,
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

@Component({
  selector: 'geo-main-view-map',
  templateUrl: './main-view-map.component.html',
  styleUrls: ['./main-view-map.component.scss'],
})
export class MainViewMapComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @Input() public setView$: Subject<CoordinatesType> | undefined = undefined;
  @Input() public setSearch$: Subject<string> | undefined = undefined;
  @Input() public points: IPointGeoObject[] = [];
  @Input() public geopark: any | undefined = undefined;

  public map: Map | undefined = undefined;
  public isLegendShowed: boolean = false;
  public destroy$: Subject<void> = new Subject<void>();
  public hidden: boolean = false;
  private markerLayer: VectorLayer<any> | undefined = undefined;
  private markerListenerCallBack: ((evt: MapBrowserEvent<any>) => void) | undefined = undefined;
  private mapStateChangeDebouncer: Subject<void> = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef,
    private mapCacheService: MapCacheService
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['geopark']) {
      if (changes['geopark'].currentValue) {
        const style = new Style({
          stroke: new Stroke({
            color: 'red',
            width: 1,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0)',
          }),
        });
        const layer: any = LayerByIdMap.get(changes['geopark'].currentValue.id);
        if (layer) {
          const source = new VectorSource({
            features: new GeoJSON().readFeatures(layer, { featureProjection: 'EPSG:3857' }),
          });
          const mapLayer = new VectorLayer({
            source: source,
            style,
          });
          this.map?.addLayer(mapLayer);
          
          // Cache the geopark layer data
          this.cacheGeoparkLayer(changes['geopark'].currentValue.id, layer);
        }
        if (this.setView$) {
          this.map?.setView(
            new View({
              center: fromLonLat([this.geopark?.longitude, this.geopark?.latitude]),
              zoom: 9,
            })
          );
        }
      }
    }
    if (changes['points']) {
      if (changes['points'].currentValue?.length !== changes['points'].previousValue?.length) {
        this.renderPoints();
        
        // Cache the points if they're loaded from API
        if (this.points.length > 0) {
          this.cachePoints();
        }
      }
    }
  }

  public ngOnInit(): void {
    if (this.setView$) {
      this.setView$
        .pipe(takeUntil(this.destroy$))
        .subscribe((coordinates: CoordinatesType) => {
          this.map?.setView(
            new View({
              center: fromLonLat([coordinates.longitude, coordinates.latitude]),
              zoom: 18,
            })
          );
        });
    }

    if (this.setSearch$) {
      this.setSearch$
        .pipe(takeUntil(this.destroy$), debounceTime(500))
        .subscribe((search: string) => {
          this.searchMap(search);
        });
    }

    // Setup debouncer for map state changes to avoid excessive writes to IndexedDB
    this.mapStateChangeDebouncer
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.cacheMapState();
      });
      
    // Try to load cached points if available
    this.loadCachedPoints();
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.restoreMapState().then(restoredState => {
        this.initializeMap();
  
        if (restoredState) {
          this.loadCachedLayers(); // Загружаем кешированные слои только если карта восстановлена
        }
      });
    });
  }

  private async initializeMap(): Promise<void> {
    const restoredState = await this.restoreMapState();

    const viewOptions = restoredState 
      ? { center: restoredState.center, zoom: restoredState.zoom }
      : DEFAULT_EXTENT;
      
    this.map = new Map({
      layers: [
        new Tile({
          source: new OSM(),
        }),
      ],
      target: 'map',
      view: new View(viewOptions),
    });

    if (this.points.length) {
      this.renderPoints();
    }

    // Cache the map state on view change
    this.map.getView().on('change', () => {
      this.mapStateChangeDebouncer.next();
    });
    
    // Add event listener for map move end to cache map state
    this.map.on('moveend', () => {
      this.mapStateChangeDebouncer.next();
    });
  }

  private renderPoints(): void {
    if (!this.map) return;
    
    const features: Feature<Point>[] = this.getFeatures(this.points);
    const markerLayer: VectorLayer<any> = new VectorLayer<any>({
      source: new VectorSource({
        features,
      }),
    });
    
    if (this.markerLayer) {
      this.map.removeLayer(this.markerLayer);
    }
    
    this.markerLayer = markerLayer;
    this.map.addLayer(markerLayer);
    this.addMarkerClickListener();
  }

  private async cacheMapState(): Promise<void> {
    if (!this.geopark?.id || !this.map) return;
    const center = this.map?.getView().getCenter();
    const zoom = this.map?.getView().getZoom();
    if (center && zoom !== undefined) {
      const mapState: MapState = {
        center: center,
        zoom: zoom,
        timestamp: Date.now(),
        geoparkId: this.geopark.id
      };
      await this.mapCacheService.set(`mapState_${this.geopark.id}`, mapState);
    }
  }

  private async restoreMapState(): Promise<MapState | undefined> {
    if (!this.geopark?.id) return undefined;
  
    try {
      const mapState = await this.mapCacheService.get<MapState>(`mapState_${this.geopark.id}`);
  
      if (mapState && mapState.geoparkId === this.geopark.id && (Date.now() - mapState.timestamp < CACHE_TTL)) {
        return mapState;
      }
    } catch (error) {
      console.error("Ошибка при восстановлении состояния карты:", error);
    }
  
    return {
      center: DEFAULT_EXTENT.center as number[],
      zoom: DEFAULT_EXTENT.zoom as number,
      timestamp: Date.now(),
      geoparkId: this.geopark?.id || "unknown",
    };
  }
  
  

  private async cachePoints(): Promise<void> {
    if (this.points.length) {
      await this.mapCacheService.set('cachedPoints', {
        points: this.points,
        timestamp: Date.now()
      });
    }
  }

  private async loadCachedPoints(): Promise<void> {
    // Only load cached points if we don't have points yet
    if (this.points.length === 0) {
      const cachedPointsData = await this.mapCacheService.get<{points: IPointGeoObject[], timestamp: number}>('cachedPoints');
      
      // Use cached points only if they exist and aren't too old
      if (cachedPointsData && (Date.now() - cachedPointsData.timestamp < CACHE_TTL)) {
        this.points = cachedPointsData.points;
      }
    }
  }

  private async cacheGeoparkLayer(id: string, layerData: any): Promise<void> {
    // const center = this.map?.getView().getCenter();
    // const zoom = this.map?.getView().getZoom();
    // const mapState: MapState = {
    //   center: center,
    //   zoom: zoom,
    //   timestamp: Date.now()
    // };
    await this.mapCacheService.set(`geopark_${id}`, {
      data: layerData,
      timestamp: Date.now()
    });
  }

  private async loadCachedLayers(): Promise<void> {
    if (this.geopark?.id) {
      const cachedLayer = await this.mapCacheService.get<{data: any, timestamp: number}>(`geopark_${this.geopark.id}`);
      
      if (cachedLayer && (Date.now() - cachedLayer.timestamp < CACHE_TTL)) {
        const style = new Style({
          stroke: new Stroke({
            color: 'red',
            width: 1,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0)',
          }),
        });
        
        const source = new VectorSource({
          features: new GeoJSON().readFeatures(cachedLayer.data, { featureProjection: 'EPSG:3857' }),
        });
        
        const mapLayer = new VectorLayer({
          source: source,
          style,
        });
        
        this.map?.addLayer(mapLayer);
      }
    }
  }

  public setFullExtent(): void {
    const extent: ViewOptions =
      this.geopark && this.geopark?.longitude && this.geopark.latitude
        ? { center: fromLonLat([this.geopark?.longitude, this.geopark?.latitude]), zoom: 9 }
        : DEFAULT_EXTENT;
    this.map?.setView(new View({ ...extent }));
  }

  private addMarkerClickListener(): void {
    if (this.markerListenerCallBack) {
      this.map?.un('click', this.markerListenerCallBack);
    }
    this.markerListenerCallBack = (evt: MapBrowserEvent<any>) => {
      const markerFeature = this.map?.forEachFeatureAtPixel(evt.pixel, (feature) => {
        return feature;
      });
      if (markerFeature?.get('geometry') instanceof Point) {
        this.dialog.open(MarkerInfoModalComponent, { data: { ...markerFeature.getProperties() } });
      }
    };
    this.map?.on('click', this.markerListenerCallBack);
  }

  private searchMap(search: string): void {
    const features: Feature[] = this.markerLayer?.getSource().getFeatures();
    if (features) {
      features.forEach((feature: Feature) => {
        feature.setStyle(this.getStyle(feature.getProperties() as IGeoObjectFilterFields, search));
      });
    }
  }

  private getFeatures(points: IPointGeoObject[]): Feature<Point>[] {
    const features: Feature<Point>[] = points.map((point: IPointGeoObject) => {
      const feature: Feature<Point> = new Feature<Point>({
        geometry: new Point(fromLonLat([point.longitude, point.latitude])),
        ...point,
      });
      feature.setId(point.id);
      feature.setStyle(
        new Style({
          image: new Icon({ 
            src: `../../../../assets/icons/${CommonTypeIconMap.get((point as GeoobjectModel).common_type)}`, 
            scale: [0.45, 0.45] 
          }),
        })
      );
      return feature;
    });
    return features;
  }

  private getStyle({ name, common_type, description }: IGeoObjectFilterFields, search: string): Style {
    if (name.toLowerCase().includes(search.toLowerCase()) || common_type.toLowerCase().includes(search.toLowerCase())) {
      return new Style({
        image: new Icon({ 
          src: `../../../../assets/icons/${CommonTypeIconMap.get(common_type)}`, 
          scale: [0.45, 0.45] 
        }),
      });
    }
    return new Style({});
  }

  public toggleLegend(): void {
    this.isLegendShowed = !this.isLegendShowed;
  }


  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapStateChangeDebouncer.complete();
  }
}