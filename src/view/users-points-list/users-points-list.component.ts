import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { DecimalPipe } from '@angular/common';
import { GeoobjectService, GeoparksService } from '@api';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import Map from "ol/Map";
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import Tile from 'ol/layer/Tile';
import View from 'ol/View';
import { Subject, takeUntil } from 'rxjs';
import { LAYER_TOROTAU, YA_LAYER } from '@shared';
import GeoJSON from 'ol/format/GeoJSON';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
interface GeoLabel {
  id: string;
  type: string;
  comment: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export const GeoparksCoordsMap: {[key: string]: { latitude: number, longitude: number, layer: any }} = {
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
  selector: 'geo-users-points-list',
  templateUrl: './users-points-list.component.html',
  styleUrls: ['./users-points-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    DecimalPipe,
    MatProgressSpinnerModule,
    MatIconModule
  ]
})
export class UsersPointsListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  public map: Map | undefined;
  public markerLayers: VectorLayer<any>[] = [];
  public labels: GeoLabel[] = [];
  public isLoading = true;
  public errorLoading = false;
  private pointId : string | undefined;
  constructor(
    private geoparkSerivce: GeoparksService,
    private activatedRoute: ActivatedRoute,
    private geoobjectService: GeoobjectService

  ) {}

  ngOnInit(): void {
    this.loadUserPoints();
  }

  private loadUserPoints(): void {
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    
    this.geoparkSerivce.getUsersPointsByGeoparkIdGeoparksByGeoparkGeoparkIdGet(geoparkId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.labels = this.transformApiResponse(response);
          this.isLoading = false;
          // Добавляем маркеры после инициализации карты
          if (this.map) {
            this.addMarkersForLabels();
          }
        },
        error: (err) => {
          console.error('Ошибка при загрузке пользовательских меток:', err);
          this.isLoading = false;
          this.errorLoading = true;
        }
      });
  }

  private transformApiResponse(apiData: any): GeoLabel[] {
    // Преобразуем данные API в формат, ожидаемый компонентом
    return apiData.map((item: any) => {
      console.log('ITEM FROM API:', item); // <-- Важно!
      return {
      id: item.id,
      type: item.Type || 'Неизвестный тип',
      comment: item.Comment || 'Нет описания',
      photoUrl: item.photoUrl || null,
      latitude: item.latitude,
      longitude: item.longitude
    };
  });
  }

  ngAfterViewInit(): void {
    this.initMap();
    // Если данные уже загружены, добавляем маркеры
    if (this.labels.length > 0) {
      this.addMarkersForLabels();
    }
  }

  private initMap(): void {
    const geoparkId = this.activatedRoute.snapshot.params['geoparkId'];
    const geoparkCoords = GeoparksCoordsMap[geoparkId];

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geoparkCoords.layer, { featureProjection: 'EPSG:3857' }),
    });
    
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: 'red',
          width: 1,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0.1)',
        }),
      }),
    });

    this.map = new Map({
      target: "form-map",
      view: new View({
        center: fromLonLat([geoparkCoords.longitude, geoparkCoords.latitude]),
        zoom: 9,
      }),
      layers: [
        new Tile({
          source: new OSM()
        }),
        vectorLayer,
      ]
    });
  }

  // Остальные методы остаются без изменений
  private addMarkersForLabels(): void {
    this.clearMarkers();
    this.labels.forEach(label => {
      this.addMarker(label.longitude, label.latitude, label.id);
    });
  }

  private addMarker(longitude: number, latitude: number, id: string): void {
    const feature = new Feature<Point>({
      geometry: new Point(fromLonLat([longitude, latitude]))
    });
    
    feature.set('id', id);
    feature.setStyle(new Style({
      image: new Icon({ 
        src: 'assets/icons/marker.png', 
        width: 20, 
        height: 32 
      }),
    }));

    const vectorSource = new VectorSource({
      features: [feature]
    });

    const markerLayer = new VectorLayer({
      source: vectorSource
    });

    this.map?.addLayer(markerLayer);
    this.markerLayers.push(markerLayer);
  }

  public onLabelClick(label: GeoLabel): void {
    this.map?.getView().animate({
      center: fromLonLat([label.longitude, label.latitude]),
      zoom: 15,
      duration: 500
    });
    
    this.highlightMarker(label.id);
  }

  private highlightMarker(labelId: string): void {
    this.markerLayers.forEach(layer => {
      const features = layer.getSource()?.getFeatures();
      features?.forEach((feature: Feature) => {
        const isSelected = feature.get('id') === labelId;
        feature.setStyle(new Style({
          image: new Icon({
            src: 'assets/icons/marker.png',
            width: isSelected ? 30 : 20,
            height: isSelected ? 48 : 32,
          })
        }));
      });
    });
  }

  private clearMarkers(): void {
    this.markerLayers.forEach(layer => {
      this.map?.removeLayer(layer);
    });
    this.markerLayers = [];
  }

  public formatCoordinate(coord: number): string {
    return coord.toFixed(4);
  }

  ngOnDestroy(): void {
    this.destroy$?.next();
    this.destroy$?.complete();
    this.clearMarkers();
  }

  getStatusText(status: string | undefined): string {
    switch(status) {
      case 'approved': return 'Одобрена';
      case 'rejected': return 'Отклонена';
      default: return 'На рассмотрении';
    }
  }
  
  approveLabel(label: GeoLabel): void {
    const save$ = this.geoobjectService.createGeoobjectGeoobjectPost({
      name: `Пользовательская точка: ${label.type}`,
      description: label.comment,
      type: 'Пользовательская точка',
      latitude: label.latitude,
      longitude: label.longitude,
      geopark_id: this.activatedRoute.snapshot.params['geoparkId'],
      common_type: label.type
    });
  
    save$.pipe(
      switchMap((res: any) => {
        const geoobjectId = res.id;
        const filesArrStreams: Array<Observable<unknown>> = [];
  
        // Заглушка: загрузка фото
        if (label.photoUrl) {
          // Пример: filesArrStreams.push(this.photoService.addPhotoPhotoPost(geoobjectId, false, [file]));
        }
  
        return filesArrStreams.length ? forkJoin(filesArrStreams) : of([]);
      }),
      switchMap(() => {
        // Удаляем пользовательскую точку после создания geoobject
        return this.geoparkSerivce.deleteUserPointGeoparksPointPointIdDelete(label.id);
      })
    ).subscribe({
      next: () => {
        // Удаляем метку из локального списка
        this.labels = this.labels.filter(l => l.id !== label.id);
        this.clearMarkers();
        this.addMarkersForLabels();
        console.log('Метка одобрена, сохранена и удалена из пользовательских.');
      },
      error: (err) => {
        console.error('Ошибка при одобрении метки:', err);
        alert('Произошла ошибка при обработке метки');
      }
    });
  }
  
  
  rejectLabel(labelId: string): void {
    this.geoparkSerivce.deleteUserPointGeoparksPointPointIdDelete(labelId)
      .subscribe({
        next: () => {
          this.labels = this.labels.filter(l => l.id !== labelId);
          this.clearMarkers();
          this.addMarkersForLabels();
          console.log('Точка удалена');
        },
        error: (err) => {
          console.error('Ошибка при удалении точки:', err);
          alert('Ошибка при удалении точки');
        }
      });
  }
  
}