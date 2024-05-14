import { Component } from '@angular/core';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Tile from 'ol/layer/Tile';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import View, { ViewOptions } from 'ol/View';
import { fromLonLat } from 'ol/proj';
import {
  get as getProjection,
} from 'ol/proj.js';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { HISTORY_CULTURE_GAF, PROM_ROUTE } from '@shared';
import VectorLayer from 'ol/layer/Vector';

const DEFAULT_EXTENT: ViewOptions = {
  center: fromLonLat([55.958596, 54.735148]),
  zoom: 7,
  projection: getProjection('EPSG:3857')!,
}
@Component({
  selector: 'geo-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss']
})
export class RoutesComponent {
  public map: Map | undefined = undefined;

  public ngAfterViewInit(): void {
    setTimeout(() => {
      const style = new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 3,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0)',
        }),
      });
      const routeVectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(PROM_ROUTE, { featureProjection: 'EPSG:3857'}),
      });
      const routeVectorSource1 = new VectorSource({
        features: new GeoJSON().readFeatures(HISTORY_CULTURE_GAF, { featureProjection: 'EPSG:3857'}),
      });
      // const torVectorSource = new VectorSource({
      //   features: new GeoJSON().readFeatures(LAYER_TOROTAU, { featureProjection: 'EPSG::4326'}),
      // });
      const vectorLayerRoute = new VectorLayer({
        source: routeVectorSource,
        style,
      });
      const vectorLayerRoute1 = new VectorLayer({
        source: routeVectorSource1,
        style,
      });
      // const vectorLayerYa = new VectorLayer({
      //   source: yaVectorSource,
      //   style,
      // });
    
      this.map = new Map({
        layers: [
          new Tile({
            source: new OSM(),
          }),
          vectorLayerRoute,
          vectorLayerRoute1,
        ],
        target: 'map',
        view: new View({ 
          ...DEFAULT_EXTENT
        }),
      });
  
      // const features: Feature[] = GEOPARKS.map((geopark: IGeopark) => {
      //   const feature: Feature<Point> = new Feature<Point>({ 
      //     geometry: new Point(fromLonLat([geopark.longitude, geopark.latitude])), 
      //     ...geopark, 
      //   });
      //   feature.setId(geopark.id);
      //   feature.setStyle(new Style({
      //       image: new Icon({src: `../../../../assets/icons/location-green.png`, scale: [0.5, 0.5]}),
      //   }));
      //   return feature;
      // });
  
      // const markerLayer: VectorLayer<any> = new VectorLayer<any>({
      //   source: new VectorSource({
      //     features,
      //   }),
      // });
      // this.map.addLayer(markerLayer);
      // this.addMarkerClickListener();
      
    });
  }

}
