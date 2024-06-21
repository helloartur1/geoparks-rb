import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { POINTS, TypeIconMap } from "@shared";
import { IPointGeoObject } from "@core";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import Tile from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import { GeoobjectDetailModelService, IGeoobjectDetailModel } from './services/geoobject-detail-model.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'geo-geoobject-detail-view',
  templateUrl: './geoobject-detail-view.component.html',
  styleUrls: ['./geoobject-detail-view.component.scss']
})
export class GeoobjectDetailViewComponent implements OnInit, AfterViewInit {
  public map1: Map | undefined = undefined;
  private markerLayer: VectorLayer<any> | undefined = undefined;
  title = 'openLayerMap';

  public geoobjectUid: string = '';
  public geoobject: IPointGeoObject | undefined = undefined;
  public model$: Observable<IGeoobjectDetailModel>;

  constructor(private activatedRoute: ActivatedRoute, private geoobjectDetailModelService: GeoobjectDetailModelService) {
    this.model$ = this.geoobjectDetailModelService.model$.asObservable();
  }

  public ngOnInit(): void {
    const geoobjectUid = this.activatedRoute.snapshot.params['geoobjectUid'] || '';
    this.geoobjectDetailModelService.init(geoobjectUid);
  }

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
