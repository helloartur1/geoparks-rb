import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CoordinatesType, IGeoObjectFilterFields, IPointGeoObject } from '@core';
import { MarkerInfoModalComponent, POINTS, TypeIconMap } from '@shared';
import Map from 'ol/Map';
import View, { ViewOptions } from 'ol/View';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { MatDialog } from '@angular/material/dialog';

const DEFAULT_EXTENT: ViewOptions = {
  center: [58.155889, 55.179724],
  projection: 'EPSG:4326',
  zoom: 11,
  maxZoom: 18,
}
@Component({
  selector: 'geo-main-view-map',
  templateUrl: './main-view-map.component.html',
  styleUrls: ['./main-view-map.component.scss']
})
export class MainViewMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public setView$: Subject<CoordinatesType> | undefined = undefined;
  @Input()
  public setSearch$: Subject<string> | undefined = undefined;
  public map: Map | undefined = undefined;
  public destroy$: Subject<void> = new Subject<void>();
  public hidden: boolean = false;
  private markerLayer: VectorLayer<any> | undefined = undefined;

  constructor(private dialog: MatDialog, private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    if (this.setView$) {
      this.setView$.pipe(takeUntil(this.destroy$)).subscribe((coordinates: CoordinatesType) => {
        this.map?.setView(new View({
          center: [coordinates.longitude, coordinates.latitude],
          projection: 'EPSG:4326',
          zoom: 18,
          maxZoom: 20,
        }));
      })
    }

    if (this.setSearch$) {
      this.setSearch$.pipe(takeUntil(this.destroy$), debounceTime(500)).subscribe((search: string) => {
        this.searchMap(search);
      });
    }
  }


  public ngAfterViewInit(): void {
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: 'map',
      view: new View({ 
        ...DEFAULT_EXTENT
      }),
    });

    const features: Feature<Point>[] = this.getFeatures(POINTS);
    const markerLayer: VectorLayer<any> = new VectorLayer<any>({
      source: new VectorSource({
        features,
      }),
    });
    this.markerLayer = markerLayer;
    this.map.addLayer(markerLayer);
    this.addMarkerClickListener();
  }

  public setFullExtent(): void {
    this.map?.setView(new View({...DEFAULT_EXTENT}));
  }

  private addMarkerClickListener(): void {
    this.map?.on('click', (evt: MapBrowserEvent<any>) => {
      const markerFeature = this.map?.forEachFeatureAtPixel(evt.pixel, (feature) => {
        return feature;
      });
      if (markerFeature?.get('geometry') instanceof Point) {
        this.dialog.open(MarkerInfoModalComponent, { data: {
          ...markerFeature.getProperties()
        }})
      }
    });
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
        geometry: new Point([point.longitude, point.latitude]), 
        ...point, 
      });
      feature.setId(point.id);
      feature.setStyle(new Style({
           image: new Icon({src: `../../../../assets/icons/${TypeIconMap.get(point.type)}`, scale: [0.5, 0.5]}),
      }));
      return feature;
    });
    return features;
  }

  private getStyle({ name, type, description }: IGeoObjectFilterFields, search: string): Style {
    if (name.toLowerCase().includes(search.toLowerCase()) || type.toLowerCase().includes(search.toLowerCase())) {
      return new Style({
        image: new Icon({src: `../../../../assets/icons/${TypeIconMap.get(type)}`, scale: [0.5, 0.5]}),
      });
    }
    return new Style({})
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
