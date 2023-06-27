import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IPointGeoObject } from '@core';

@Component({
  selector: 'geo-marker-info-modal',
  templateUrl: './marker-info-modal.component.html',
  styleUrls: ['./marker-info-modal.component.scss']
})
export class MarkerInfoModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IPointGeoObject, 
    private matDialogRef: MatDialogRef<MarkerInfoModalComponent>
    ) {}

    public close(): void {
      this.matDialogRef.close(false);
    }

    public confirm(): void {
      this.matDialogRef.close(true);
    }

}
