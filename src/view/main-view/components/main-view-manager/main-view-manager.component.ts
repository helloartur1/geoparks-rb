import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CoordinatesType, IPointGeoObject } from '@core';

const DETAIL_PAGE_ROUTE: string = 'detail';
@Component({
  selector: 'geo-main-view-manager',
  templateUrl: './main-view-manager.component.html',
  styleUrls: ['./main-view-manager.component.scss']
})
export class MainViewManagerComponent {
  @Input()
  public items: IPointGeoObject[] = [];

  @Output()
  public setView: EventEmitter<CoordinatesType> = new EventEmitter<CoordinatesType>();

  constructor(private router: Router) {}

  public zoomToObject(latitude: number, longitude: number): void {
    this.setView.emit({ latitude, longitude });
  }

  public navigateToDetailPage(uid: string): void {
    this.router.navigate([`${DETAIL_PAGE_ROUTE}/${uid}`]);
  }
}
