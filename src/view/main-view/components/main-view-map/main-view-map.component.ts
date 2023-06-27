import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CoordinatesType, IPointGeoObject } from '@core';
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
import { Subject, takeUntil } from 'rxjs';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import Layer from 'ol/layer/Layer';
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
  public map: Map | undefined = undefined;
  public destroy$: Subject<void> = new Subject<void>();

  constructor(private dialog: MatDialog) {}

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

    const features: Feature[] = POINTS.map((point: IPointGeoObject) => {
      const feature: Feature = new Feature({ 
        geometry: new Point([point.longitude, point.latitude]), 
        ...point, 
      });
      feature.setId(point.id);
      feature.setStyle(new Style({
           image: new Icon({src: `../../../../assets/icons/${TypeIconMap.get(point.type)}`, scale: [0.5, 0.5]}),
      }));
      return feature;
    });
    const markerLayer: VectorLayer<any> = new VectorLayer<any>({
      source: new VectorSource({
        features,
      })
    });
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

  private getLayerByUid(uid: number): Layer | undefined {
    const markerFeature: Layer | undefined = this.map?.getAllLayers().find((feature: Layer) => {
      return (feature as any)['ol_uid'] === uid.toString()
    });
    return markerFeature;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
