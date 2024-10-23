import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GeoobjectModel, GeoobjectService, PhotoService } from '@api';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import Map from "ol/Map";
import { fromLonLat, toLonLat } from 'ol/proj';
import  OSM  from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import Tile from 'ol/layer/Tile';
import View from 'ol/View';
import { Subject, debounceTime, forkJoin, of, switchMap, take, takeUntil } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '@core';
import { LAYER_TOROTAU, YA_LAYER } from '@shared';
import GeoJSON from 'ol/format/GeoJSON';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { Observable } from 'rxjs';
import { FileUploader } from 'ng2-file-upload';

export const GeoparksCoordsMap: {[key: string]: { latitude:number, longitude: number, layer: any }} = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': {
    latitude: 58.2935,
    longitude: 55.2455,
    layer: YA_LAYER,
  },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': {
    latitude: 53.554764,
    longitude: 56.096764,
    layer: LAYER_TOROTAU,
  }

};
@Component({
  selector: 'geo-geoobject-form',
  templateUrl: './geoobject-form.component.html',
  styleUrls: ['./geoobject-form.component.scss']
})
export class GeoobjectFormComponent implements OnInit, AfterViewInit {
  @ViewChild('fileUpload') public fileUpload: ElementRef<HTMLInputElement> | undefined = undefined;
  public map: Map | undefined = undefined;
  private destroy$: Subject<void> = new Subject<void>();
  public form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    longitude: new FormControl(null, [Validators.required]),
    latitude: new FormControl(null, [Validators.required]),
    type: new FormControl(null, [Validators.required]),
    geopark: new FormControl('', [Validators.required])
  });
  public error: boolean = false;
  public markerLayer: VectorLayer<any> | null = null;
  public categories: Array<{ name: string, value: string }> = [
    {
      name: 'Культура, история и образование',
      value: 'Культура, история и образование'
    },
    {
      name: 'Рекрация, отдых и развлечения',
      value: 'Рекрация, отдых и развлечения'
    },
    {
      name: 'Природа и геология',
      value: 'Природа и геология'
    },
    {
      name: 'Общая инфраструктура',
      value: 'Общая инфраструктура'
    },
  ];

  constructor(private geoobjectService: GeoobjectService, private router: Router, private activatedRoute: ActivatedRoute, private photoService: PhotoService) {}


  public ngOnInit(): void {
    this.form.patchValue({ geopark: this.activatedRoute.snapshot.params['geoparkId']});
    const geoobjectId: string | undefined = this.activatedRoute.snapshot.params['geoobjectId'];
    if (geoobjectId) {
      this.geoobjectService.getGeoobjectByIdGeoobjectIdGet(geoobjectId).pipe(take(1)).subscribe((data: GeoobjectModel) => {
        this.form.patchValue({
          description: data.description,
          longitude: data.longitude,
          latitude: data.latitude,
          type: data.common_type,
          name: data.name,
          geopark: this.activatedRoute.snapshot.params['geoparkId']
        });

      });

    }
    this.form.get('latitude')?.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe((latitude: number| null) => {
      if (this.form.value.longitude && latitude) {
        console.log('Refresh')
        this.refreshMarkerByCoords(this.form.value.longitude, latitude)
      }
    });
    this.form.get('longitude')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((longitude: number| null) => {

      if (this.form.value.latitude && longitude) {
        this.refreshMarkerByCoords(longitude, this.form.value.latitude)
      }
    });
    
  }

  public ngAfterViewInit(): void {
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(GeoparksCoordsMap[this.form.value.geopark].layer, { featureProjection: 'EPSG:3857' }),
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: 'red',
          width: 1,
        }),
        fill: new Fill({
          color: 'blue',
        }),
      }),
    });
    const geoparkCoords: { latitude: number, longitude: number } = GeoparksCoordsMap[this.form.value.geopark];
    this.map = new Map({
      target: "form-map",
      view: new View({
        center: fromLonLat([geoparkCoords.longitude, geoparkCoords.latitude]),
        zoom: 10,
      }),
      layers: [
        new Tile({
          source: new OSM()
        }),
        vectorLayer,
      ]
    });
    this.map.on('dblclick', (evt: MapBrowserEvent<any>) => {
      evt.preventDefault();
      const [longitude, latitude] = toLonLat(evt.coordinate);
      this.form.get('longitude')?.patchValue(longitude, { emitEvent: false});
      this.form.get('latitude')?.patchValue(latitude, { emitEvent: false})
      this.refreshMarkerByCoords(longitude, latitude)
      
    });
  }

  public refreshMarkerByCoords(longitude: number, latitude: number): void {
    if (this.markerLayer) {
      this.map?.removeLayer(this.markerLayer);
    }
    const feature: Feature<Point> = new Feature<Point>({
      geometry: new Point(fromLonLat([longitude, latitude]))});
    feature.setStyle(new Style({
      image: new Icon({ src: '../../../../assets/icons/marker.png', width: 20, height: 32 }),
    }));
    const vectorSource = new VectorSource({
      features: [feature]
    });

    this.markerLayer = new VectorLayer({
      source: vectorSource
    });

    this.map?.addLayer(this.markerLayer);
  }

  public save(): void {
    const { name, description, latitude, longitude, type, geopark } = this.form.value;
    const save$: Observable<any> = this.activatedRoute.snapshot.params['geoobjectId'] ? this.geoobjectService.updateGeoobjectGeoobjectPut(this.activatedRoute.snapshot.params['geoobjectId'], {
      name,
      description,
      type,
      latitude,
      longitude,
      geopark_id: geopark,
      common_type: type,
    }) :
    this.geoobjectService.createGeoobjectGeoobjectPost({
      name,
      description,
      type,
      latitude,
      longitude,
      geopark_id: geopark,
      common_type: type,
    });
    save$.pipe(
      switchMap((res: any) => {
        let geoobjectId: string = this.activatedRoute.snapshot.params['geoobjectId'];
        if (res.id) {
          geoobjectId = res.id;
        }
        const files: FileList | null | undefined = this.fileUpload?.nativeElement?.files;
        console.log(this.fileUpload);
        console.log(files);
        const filesArrStreams: Array<Observable<unknown>> = [];
        if (files && files.length) {
          for (let i = 0; i < files?.length; i++) {
            filesArrStreams.push(this.photoService.addPhotoPhotoPost(geoobjectId, false, [files[i]]))
          }
        }
        if (filesArrStreams.length) {
          return forkJoin(filesArrStreams);
        }
        return of([]);
        
    }))
    .subscribe({
      next: () => {
        console.log('Navigate');
        this.router.navigate([AppRoutes.MAIN]);
      },
      error: () => {
        this.error = true;
        setTimeout(() => {
          this.error = false;
        }, 5000);
      },
    })
  }

  

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
