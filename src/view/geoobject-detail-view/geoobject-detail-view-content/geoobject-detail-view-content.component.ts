import { Component, Input } from '@angular/core';
import { GeoobjectModel } from '@api';
import { IPointGeoObject } from '@core';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import Map from "ol/Map";
import { fromLonLat } from 'ol/proj';
import  OSM  from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import Tile from 'ol/layer/Tile';
import View from 'ol/View';
import { TypeIconMap } from '@shared';
@Component({
  selector: 'geo-geoobject-detail-view-content',
  templateUrl: './geoobject-detail-view-content.component.html',
  styleUrls: ['./geoobject-detail-view-content.component.scss']
})
export class GeoobjectDetailViewContentComponent {
  @Input()
  public geoobject!: GeoobjectModel;
  @Input()
  public photos!: Array<{ path: string}>;
  public map1: Map | undefined = undefined;
  private markerLayer: VectorLayer<any> | undefined = undefined;

  public ngAfterViewInit(): void {
    this.map1 = new Map({
      target: "map1",
      view: new View({
        center: fromLonLat([58.155889, 55.179724]),
        zoom: 10,
      }),
      layers: [
        new Tile({
          source: new OSM()
        })
      ]
    });

    const feature: Feature<Point> = this.getFeature(this.geoobject);
    const vectorSource = new VectorSource({
      features: [feature]
    });

    this.markerLayer = new VectorLayer({
      source: vectorSource
    });

    this.map1.addLayer(this.markerLayer);
  }

  private getFeature(point: IPointGeoObject | undefined): Feature<Point> {
    if (!point) {
      return new Feature<Point>();
    }

    const feature: Feature<Point> = new Feature<Point>({
      geometry: new Point(fromLonLat([point.longitude, point.latitude])),
      ...point,
    });
    feature.setId(point.id);
    feature.setStyle(new Style({
      image: new Icon({ src: `../../../../assets/icons/${TypeIconMap.get(point.type)}`, scale: [0.5, 0.5] }),
  }));

    return feature;
  }

}
