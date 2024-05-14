import { Component } from '@angular/core';
import Tile from 'ol/layer/Tile';
import View, { ViewOptions } from 'ol//View';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector';
import { GeoparkInfoModalComponent, LAYER_TOROTAU, YA_LAYER } from '@shared';
import VectorLayer from 'ol/layer/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import { GEOPARKS } from 'src/shared/const/geoparks';
import  Feature  from 'ol/Feature';
import { IGeopark } from '@core';
import Point from 'ol/geom/Point';
import Icon from 'ol/style/Icon';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  get as getProjection,
} from 'ol/proj.js';
const DEFAULT_EXTENT: ViewOptions = {
  center: fromLonLat([55.958596, 54.735148]),
  zoom: 7,
  projection: getProjection('EPSG:2500')!,
}
@Component({
  selector: 'geo-geoparks',
  templateUrl: './geoparks.component.html',
  styleUrls: ['./geoparks.component.scss']
})
export class GeoparksComponent {
  public map: Map | undefined = undefined;
  private markerListenerCallBack: ((evt: MapBrowserEvent<any>) => void) | undefined = undefined;

  public imagePaths: string[] = [
    '../../assets/img/424689e3266131a6648d94fa64ca7eb6.png',
    '../../assets/img/e91b0d26b17a9c87421a26c24e01274e.png',
    '../../assets/img/sterlitamakskie-shihany.jpg',
    '../../assets/img/Геопарк Торатау- 2.jpg',
    '../../assets/img/Геопарк Торатау-1.jpg',
  ];
  public activeImageIndex: number = 0;
  constructor(private dialog: MatDialog, private router: Router) {}

  public setFullExtent(): void {
    this.map?.setView(new View({...DEFAULT_EXTENT}));
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      const style = new Style({
        stroke: new Stroke({
          color: 'red',
          width: 1,
        }),
        fill: new Fill({
          color: 'blue',
        }),
      });
      const yaVectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(YA_LAYER, { featureProjection: 'EPSG:3857' }),
      });
      const torVectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(LAYER_TOROTAU, { featureProjection: 'EPSG::4326'}),
      });
      const vectorLayerTor = new VectorLayer({
        source: torVectorSource,
        style,
      });
      const vectorLayerYa = new VectorLayer({
        source: yaVectorSource,
        style,
      });
    
      this.map = new Map({
        layers: [
          new Tile({
            source: new OSM(),
          }),
          vectorLayerTor,
          vectorLayerYa,
        ],
        target: 'map',
        view: new View({ 
          ...DEFAULT_EXTENT
        }),
      });
  
      const features: Feature[] = GEOPARKS.map((geopark: IGeopark) => {
        const feature: Feature<Point> = new Feature<Point>({ 
          geometry: new Point(fromLonLat([geopark.longitude, geopark.latitude])), 
          ...geopark, 
        });
        feature.setId(geopark.id);
        feature.setStyle(new Style({
            image: new Icon({src: `../../../../assets/icons/location-green.png`, scale: [0.5, 0.5]}),
        }));
        return feature;
      });
  
      const markerLayer: VectorLayer<any> = new VectorLayer<any>({
        source: new VectorSource({
          features,
        }),
      });
      this.map.addLayer(markerLayer);
      this.addMarkerClickListener();
      
    });
    
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
        this.dialog.open(GeoparkInfoModalComponent, { data: {
          ...markerFeature.getProperties()
        }}).afterClosed().subscribe((success: boolean) => {
          if (success) {
            this.router.navigate([`geopark/${markerFeature.getProperties()['id']}`])
          }
        });
      }
    }
    this.map?.on('click', this.markerListenerCallBack);
  }

  public togglePrevPhoto(evt: MouseEvent): void {
    evt.preventDefault();
    if (this.activeImageIndex > 0) {
      this.activeImageIndex--;
    }
  }

  public toggleNextPhoto(evt: MouseEvent): void {
    evt.preventDefault();
    if (this.activeImageIndex < this.imagePaths.length - 1) {
      this.activeImageIndex++;
    }
  }


  public moveToGeopark(evt: MouseEvent, id: string): void {
    evt.preventDefault();
    this.router.navigate([`geopark/${id}`])
  }

}
