import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CoordinatesType, IPointGeoObject } from '@core';
import { POINTS } from '@shared';
import Map from 'ol/Map';
import View from 'ol/View';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { Subject, takeUntil } from 'rxjs';


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

  public ngOnInit(): void {
    if (this.setView$) {
      this.setView$.pipe(takeUntil(this.destroy$)).subscribe((coordinates: CoordinatesType) => {
        this.map?.setView(new View({
          center: [coordinates.longitude, coordinates.latitude],
          projection: 'EPSG:4326',
          zoom: 16,
          maxZoom: 18,
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
        center: [58.155889, 55.179724],
        projection: 'EPSG:4326',
        zoom: 10,
        maxZoom: 18, 
      }),
    });

    const markers: VectorLayer<any>[] = POINTS.map((point: IPointGeoObject) => {
      return new VectorLayer({
        source: new VectorSource({
          features: [
            new Feature({geometry: new Point([point.longitude, point.latitude])})
          ]
        }),
        style: new Style({
          image: new Icon({src: '../../../../assets/icons/location.png', scale: [0.5, 0.5]}),
        })
      })
    });
    markers.forEach((marker: VectorLayer<any>) => {
      this.map?.addLayer(marker);
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
