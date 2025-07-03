import { Component, OnInit } from '@angular/core';
import { RouteService, GeoparksService } from '@api';
import { IRoute } from '@core';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import Map from 'ol/Map';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Tile from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import Chart from 'chart.js/auto';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

import { LAYER_TOROTAU, YA_LAYER } from '@shared';

export interface GeoLabel {
  id: string;
  type: string;
  comment: string;
  latitude: number;
  longitude: number;
  status?: 'pending' | 'approved' | 'rejected';
};
export const GeoparksCoordsMap: { [key: string]: { latitude: number, longitude: number, layer: any } } = {
  '41f271c8-e8ba-4225-b21d-403f9751e5a7': {
    latitude: 55.2455,
    longitude: 58.1935,
    layer: YA_LAYER,
  },
  '07599ea7-76aa-4bbf-8335-86e2436b0254': {
    latitude: 53.654764,
    longitude: 56.296764,
    layer: LAYER_TOROTAU,
  }
};

@Component({
  selector: 'admin-stat',
  templateUrl: './admin-stat.component.html',
  styleUrls: ['./admin-stat.component.scss']
})
export class AdminStatComponent implements OnInit {
  selectedGeopark = 'toratau';

  geoparkMap: { [key: string]: string } = {
    toratau: '07599ea7-76aa-4bbf-8335-86e2436b0254',
    yangantau: '41f271c8-e8ba-4225-b21d-403f9751e5a7'
  };
  map: Map | undefined;
  heatLayer: HeatmapLayer | undefined;

  routes: IRoute[] = [];
  pendingLabels: GeoLabel[] = [];
  avgRatings: { [routeId: string]: number } = {};
  ratingCounts: { [routeId: string]: number } = {};
  ratedRoutesCount = 0;
  highRatedRoutesCount = 0;
  viewedRoutesCount: number = 0;
  totalRoutesCount: number = 0;
  showClicks: boolean = true;
  showLabels: boolean = true;
  showViewedRoutes: boolean = true;
  sectionUsage: { [key: string]: number } = {};
  activityChart: Chart | null = null;

  constructor(
    private routeService: RouteService,
    private geoparkService: GeoparksService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoutes();
    this.loadUserPoints();
    this.loadSectionUsage();
  }

  onGeoparkChange(): void {
    this.loadRoutes();
    this.loadUserPoints();
    this.loadSectionUsage();
  }

  loadRoutes(): void {
    const geoparkId = this.geoparkMap[this.selectedGeopark];
    this.routeService.getRouteByGeoparkRouteSystemRoutesGeoparkIdGet(geoparkId)
      .pipe(take(1))
      .subscribe((routes: IRoute[]) => {
        this.routes = routes;
        // сброс счётчиков перед обновлением
        this.ratedRoutesCount = 0;
        this.highRatedRoutesCount = 0;
        routes.forEach(route => {
          this.loadRouteStats(route.id);
        });
      });
  }

  loadRouteStats(routeId: string): void {
    this.routeService.getAvgScoreRouteRouteRouteIdAvgRateGet(routeId).subscribe({
      next: (res: any) => {
        this.avgRatings[routeId] = res.average_score;
        this.ratingCounts[routeId] = res.total_ratings;

        // Подсчёт — после загрузки конкретной оценки
        this.recalculateRouteStats();
      },
      error: (err: any) => {
        console.error(`Ошибка при получении статистики маршрута ${routeId}:`, err);
        this.avgRatings[routeId] = 0;
        this.ratingCounts[routeId] = 0;
        this.recalculateRouteStats();
      }
    });
  }

  recalculateRouteStats(): void {
    let rated = 0;
    let highRated = 0;
    for (const route of this.routes) {
      const avg = this.avgRatings[route.id];
      if (avg && avg > 0) {
        rated++;
        if (avg >= 4.0) {
          highRated++;
        }
      }
    }
    this.ratedRoutesCount = rated;
    this.highRatedRoutesCount = highRated;
  }

  loadUserPoints(): void {
    const geoparkId = this.geoparkMap[this.selectedGeopark];
    this.geoparkService.getUsersPointsByGeoparkIdGeoparksByGeoparkGeoparkIdGet(geoparkId)
      .pipe(take(1))
      .subscribe({
        next: (labels: any[]) => {
          const transformed = labels.map(item => ({
            id: item.id,
            type: item.Type,
            comment: item.Comment,
            latitude: item.latitude,
            longitude: item.longitude,
            status: item.status || 'pending'
          }));
          this.pendingLabels = transformed.filter(label => label.status === 'pending');
          setTimeout(() => {
            this.initHeatmap();
          }, 100); // небольшой отложенный запуск, чтобы DOM успел обновиться
        },
        error: (err) => {
          console.error('Ошибка при загрузке меток:', err);
        }
      });
  }

  goToUserPoints(): void {
    const geoparkId = this.geoparkMap[this.selectedGeopark];
    this.router.navigate(['/user-points', geoparkId]);
  }

  public initHeatmap(): void {
    const geoparkId = this.geoparkMap[this.selectedGeopark];
    const coords = GeoparksCoordsMap[geoparkId];

    // Сброс старой карты
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = undefined;
    }

    // 1. Собираем все фичи как Feature<Point>[]
    const storedClicks: { latitude: number; longitude: number }[] =
      JSON.parse(localStorage.getItem('map_clicks') || '[]');
    const clickFeatures: Feature<Point>[] = storedClicks.map(click => {
      const f = new Feature<Point>({
        geometry: new Point(fromLonLat([click.longitude, click.latitude]))
      });
      f.set('weight', 1.5);
      return f;
    });

    // Только метки типа "Жалоба"
    const labelFeatures: Feature<Point>[] = this.pendingLabels
      .filter(label => label.type === 'Жалоба')
      .map(label => {
        const f = new Feature<Point>({
          geometry: new Point(fromLonLat([label.longitude, label.latitude]))
        });
        f.set('weight', 1);
        return f;
      });

    // Просмотренные маршруты
    const viewedIds: string[] = JSON.parse(localStorage.getItem('viewed_routes') || '[]');
    const currentRouteIds = this.routes.map(r => r.id);
    this.viewedRoutesCount = viewedIds.filter(id => currentRouteIds.includes(id)).length;
    this.totalRoutesCount = currentRouteIds.length;

    const viewedRoutes = this.routes.filter(route => viewedIds.includes(route.id));
    const viewedRouteFeatures: Feature<Point>[] = viewedRoutes.flatMap(route =>
      route.route_points.map(p => {
        const f = new Feature<Point>({
          geometry: new Point(fromLonLat([p.longitude, p.latitude]))
        });
        f.set('weight', 0.7);
        return f;
      })
    );

    // 2. Собираем все включённые группы фичей
    const allFeatures: Feature<Point>[] = [];
    if (this.showClicks) {
      allFeatures.push(...clickFeatures);
    }
    if (this.showLabels) {
      allFeatures.push(...labelFeatures);
    }
    if (this.showViewedRoutes) {
      allFeatures.push(...viewedRouteFeatures);
    }

    // 3. Границы парка
    const borderLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON().readFeatures(coords.layer, {
          featureProjection: 'EPSG:3857'
        })
      }),
      style: new Style({
        stroke: new Stroke({
          color: '#305C3F',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(48, 92, 63, 0.05)'
        })
      })
    });

    // 4. Heatmap-слой с правильным generic VectorSource<Point>
    const heatLayer = new HeatmapLayer({
      source: new VectorSource<Point>({
        features: allFeatures
      }),
      blur: 15,
      radius: 8
    });

    // 5. Создаём карту
    this.map = new Map({
      target: 'stat-map',
      view: new View({
        center: fromLonLat([coords.longitude, coords.latitude]),
        zoom: 8.3
      }),
      layers: [
        new Tile({ source: new OSM() }),
        borderLayer,
        heatLayer
      ]
    });
  }

  private loadSectionUsage(): void {
    const geoparkId = this.geoparkMap[this.selectedGeopark];
    const usageRaw = localStorage.getItem(`usage_${geoparkId}`);
    const usage = usageRaw ? JSON.parse(usageRaw) : {};

    this.sectionUsage = usage;
    this.updateActivityChart();
  }

  private updateActivityChart(): void {
    const data = [
      this.sectionUsage['object-viewer'] || 0,
      this.sectionUsage['route-builder'] || 0,
      this.sectionUsage['route-viewer'] || 0,
    ];

    const labels = ['Просмотр объектов', 'Построение маршрутов', 'Просмотр маршрутов'];
    const backgroundColor = ['#42a5f5', '#03c03c', '#ff9900'];

    if (this.activityChart) {
      this.activityChart.data.datasets[0].data = data;
      this.activityChart.update();
    } else {
      const canvas = document.getElementById('userActivityChart') as HTMLCanvasElement;
      if (!canvas) return;

      this.activityChart = new Chart(canvas, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Разделы, с которыми чаще всего взаимодействуют пользователи'
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }

  generatePdfReport(): void {
    const now = new Date().toLocaleString('ru-RU');
    const geoparkName = this.selectedGeopark === 'toratau' ? 'Торатау' : 'Янган-Тау';

    // 1. Подсчитываем общее количество оценок и среднюю оценку по всем маршрутам
    let totalScoresCount = 0;
    let totalScoreSum = 0;
    for (const route of this.routes) {
      const cnt = this.ratingCounts[route.id] || 0;
      const avg = this.avgRatings[route.id] || 0;
      totalScoresCount += cnt;
      totalScoreSum += avg * cnt;
    }
    const overallAverage = totalScoresCount > 0
      ? (totalScoreSum / totalScoresCount).toFixed(2)
      : '0.00';

    // 2. Собираем текстовые строки отчёта
    const routesInfoLines = [
      `Всего маршрутов: ${this.routes.length}`,
      `Оцененных маршрутов: ${this.ratedRoutesCount} / ${this.routes.length}`,
      `Маршрутов с рейтингом ≥ 4.0: ${this.highRatedRoutesCount}`,
      `Средняя оценка по всем маршрутам: ${overallAverage}`,
      `Общее количество оценок: ${totalScoresCount}`
    ];

    const activityLines = [
      `Всего оценок: ${totalScoresCount}`,
      `Просмотр маршрутов: ${this.sectionUsage['route-viewer'] || 0}`,
      `Построение маршрутов: ${this.sectionUsage['route-builder'] || 0}`,
      `Просмотр объектов: ${this.sectionUsage['object-viewer'] || 0}`
    ];

    const complaintsCount = this.pendingLabels.length;
    const complaintLines = [
      `Ожидающих рассмотрения: ${complaintsCount}`,
      ...this.pendingLabels.map((l, i) => `${i + 1}) ${l.comment}`)
    ];

    // 3. Формируем структуру pdfmake
    const docDefinition: any = {
      content: [
        { text: `Отчет по геопарку: ${geoparkName}`, style: 'header' },
        { text: `Дата и время генерации: ${now}`, style: 'subheader' },
        '\n',
        { text: '1. Информация о маршрутах', style: 'section' },
        ...routesInfoLines.map(line => ({ text: line })),

        '\n',
        { text: '2. Пользовательская активность', style: 'section' },
        ...activityLines.map(line => ({ text: line })),

        '\n',
        { text: '3. Жалобы пользователей', style: 'section' },
        ...complaintLines.map(line => ({ text: line })),

      ],
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center' },
        subheader: { fontSize: 12, margin: [0, 0, 0, 10], alignment: 'center' },
        section: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Отчет_${geoparkName}.pdf`);
  }
}
