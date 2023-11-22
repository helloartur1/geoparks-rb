import { AfterViewInit, Component, OnInit } from '@angular/core';
import { GeoobjectService } from '@api';
import { v4 as uuidv4 } from 'uuid';
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
import { Subject, debounceTime, take, takeUntil } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Router } from '@angular/router';
import { AppRoutes } from '@core';
@Component({
  selector: 'geo-geoobject-form',
  templateUrl: './geoobject-form.component.html',
  styleUrls: ['./geoobject-form.component.scss']
})
export class GeoobjectFormComponent implements OnInit, AfterViewInit {
  public map: Map | undefined = undefined;
  private destroy$: Subject<void> = new Subject<void>();
  public form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    longitude: new FormControl(null, [Validators.required]),
    latitude: new FormControl(null, [Validators.required]),
    type: new FormControl(null, [Validators.required]),
    geopark: new FormControl('41f271c8-e8ba-4225-b21d-403f9751e5a7', [Validators.required])
  });
  public error: boolean = false;
  public markerLayer: VectorLayer<any> | null = null;
  public categories: Array<{ name: string, value: string }> = [
    {
      name: 'Туробъекты',
      value: 'Туробъекты'
    },
    {
      name: 'Пещера',
      value: 'Пещера'
    },
    {
      name: 'Горы/Скалы',
      value: 'Горы/Скалы'
    },
    {
      name: 'Болота',
      value: 'Болота'
    },
    {
      name: 'Родники и источники',
      value: 'Родники и источники'
    },
    {
      name: 'Музеи',
      value: 'Музеи'
    },
    {
      name: 'Исторические места',
      value: 'Исторические места',
    },
    {
      name: 'Геологические объекты',
      value: 'Геологические объекты',
    },
  ];

  constructor(private geoobjectService: GeoobjectService, private router: Router) {}


  public ngOnInit(): void {
    this.form.get('latitude')?.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe((latitude: number| null) => {
      if (this.form.value.longitude && latitude) {
        console.log('Refresh')
        this.refreshMarkerByCoords(this.form.value.longitude, latitude)
      }
    });
    this.form.get('longitude')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((longitude: number| null) => {

      if (this.form.value.latitude && longitude) {
        console.log('Refresh')
        this.refreshMarkerByCoords(longitude, this.form.value.latitude)
      }
    });
    
  }

  public ngAfterViewInit(): void {
    this.map = new Map({
      target: "form-map",
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
    this.map.on('dblclick', (evt: MapBrowserEvent<any>) => {
      evt.preventDefault();
      const [longitude, latitude] = toLonLat(evt.coordinate);
      this.form.get('longitude')?.patchValue(longitude, { emitEvent: false});
      this.form.get('latitude')?.patchValue(latitude, { emitEvent: false})
      console.log(longitude);
      console.log(latitude);
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
    this.geoobjectService.createGeoobjectGeoobjectPost({
      id: uuidv4(),
      name,
      description,
      type,
      latitude,
      longitude,
      geoparkId: geopark
    }).pipe(take(1)).subscribe({
      next: () => {
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
