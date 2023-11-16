import {Component, Input} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {POINTS} from "@shared";
import {IPointGeoObject} from "@core";

@Component({
  selector: 'geo-desc-geoobject-detail-view',
  templateUrl: './desc-geoobject-detail-view.component.html',
  styleUrls: ['./desc-geoobject-detail-view.component.scss']
})
export class DescGeoobjectDetailViewComponent {
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
      console.log(this.geoobject?.description)
    }
  }

}
