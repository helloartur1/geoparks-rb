import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CoordinatesType, IPointGeoObject } from '@core';

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

  public zoomToObject(latitude: number, longitude: number): void {
    this.setView.emit({ latitude, longitude });
  }
}
