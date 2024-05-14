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
import { GeoobjectModel, GeoparkModel } from '@api';
import GeoJSON from 'ol/format/GeoJSON';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';


const DEFAULT_EXTENT: ViewOptions = {
  center: fromLonLat([58.155889, 55.179724]),
  zoom: 9,
}
@Component({
  selector: 'geo-main-view-map',
  templateUrl: './main-view-map.component.html',
  styleUrls: ['./main-view-map.component.scss']
})
export class MainViewMapComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @Input()
  public setView$: Subject<CoordinatesType> | undefined = undefined;
  @Input()
  public setSearch$: Subject<string> | undefined = undefined;
  @Input()
  public points: IPointGeoObject[] = [];
  @Input()
  public geopark: GeoparkModel | undefined = undefined;
  public map: Map | undefined = undefined;
  public isLegendShowed: boolean = false;
  public destroy$: Subject<void> = new Subject<void>();
  public hidden: boolean = false;
  private markerLayer: VectorLayer<any> | undefined = undefined;
  private markerListenerCallBack: ((evt: MapBrowserEvent<any>) => void) | undefined = undefined;

  constructor(private dialog: MatDialog, private changeDetectorRef: ChangeDetectorRef) {}

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
        }
        if (this.setView$) {
          this.map?.setView(new View({
            center: fromLonLat([changes['geopark'].currentValue.longitude, changes['geopark'].currentValue.latitude]),
            zoom: 9,
          }));
        }

      }
    }
    if (changes['points']) {
      if (changes['points'].currentValue?.length !== changes['points'].previousValue?.length) {
        const features: Feature<Point>[] = this.getFeatures(this.points);
      const markerLayer: VectorLayer<any> = new VectorLayer<any>({
        source: new VectorSource({
          features,
        }),
      });
      this.markerLayer = markerLayer;
      this.map?.addLayer(markerLayer);
      this.addMarkerClickListener();
      }
    }
  }

  public ngOnInit(): void {
    if (this.setView$) {
      console.log(this.points);
      this.setView$.pipe(takeUntil(this.destroy$)).subscribe((coordinates: CoordinatesType) => {
        this.map?.setView(new View({
          center: fromLonLat([coordinates.longitude, coordinates.latitude]),
          zoom: 18,
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
    setTimeout(() => {
      this.map = new Map({
        layers: [
          new Tile({
            source: new OSM(),
          }),
        ],
        target: 'map',
        view: new View({ 
          ...DEFAULT_EXTENT
        }),
      });
      if (this.points.length) {
        const features: Feature<Point>[] = this.getFeatures(this.points);
      const markerLayer: VectorLayer<any> = new VectorLayer<any>({
        source: new VectorSource({
          features,
        }),
      });
      this.markerLayer = markerLayer;
      this.map.addLayer(markerLayer);
      this.addMarkerClickListener();
      }
    });
  }

  public setFullExtent(): void {
    const extent: ViewOptions = this.geopark && this.geopark?.longitude && this.geopark.latitude ? { center: fromLonLat([this.geopark?.longitude, this.geopark?.latitude]), zoom: 9 } : DEFAULT_EXTENT;
    this.map?.setView(new View({...extent}));
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
        this.dialog.open(MarkerInfoModalComponent, { data: {
          ...markerFeature.getProperties()
        }})
      }
    }
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
      feature.setStyle(new Style({
           image: new Icon({src: `../../../../assets/icons/${CommonTypeIconMap.get((point as GeoobjectModel).commonType)}`, scale: [0.45, 0.45]}),
      }));
      return feature;
    });
    return features;
  }

  private getStyle({ name, commonType, description }: IGeoObjectFilterFields, search: string): Style {
    if (name.toLowerCase().includes(search.toLowerCase()) || commonType.toLowerCase().includes(search.toLowerCase())) {
      return new Style({
        image: new Icon({src: `../../../../assets/icons/${CommonTypeIconMap.get(commonType)}`, scale: [0.45, 0.45]}),
      });
    }
    return new Style({})
  }

  public toggleLegend(): void {
    this.isLegendShowed = !this.isLegendShowed;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
