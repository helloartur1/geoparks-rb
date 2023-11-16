import {Component, Input, OnInit} from '@angular/core';
import {IPointGeoObject} from "@core";
import {POINTS} from "@shared";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'geo-name-geoobject-detail-view',
  templateUrl: './name-geoobject-detail-view.component.html',
  styleUrls: ['./name-geoobject-detail-view.component.scss']
})
export class NameGeoobjectDetailViewComponent{
  @Input()
  public items: IPointGeoObject[] = [];
  public geoobjectUid: string = '';
  public geoobject: IPointGeoObject | undefined = undefined;
  constructor(private activatedRoute: ActivatedRoute) {
  }
  public ngOnInit(): void{

  this.geoobjectUid = this.activatedRoute.snapshot.params['geoobjectUid'] || ''
  if (this.geoobjectUid) {
  this.geoobject = POINTS.find((item: IPointGeoObject) => item.id === this.geoobjectUid);
  console.log(this.geoobject?.name)
    }
  }
}
