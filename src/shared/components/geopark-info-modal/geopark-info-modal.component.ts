import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IGeopark } from '@core';

@Component({
  selector: 'geo-geopark-info-modal',
  templateUrl: './geopark-info-modal.component.html',
  styleUrls: ['./geopark-info-modal.component.scss']
})
export class GeoparkInfoModalComponent {
  constructor( @Inject(MAT_DIALOG_DATA) public data: IGeopark, 
  private matDialogRef: MatDialogRef<GeoparkInfoModalComponent>) {}

  public close(): void {
    this.matDialogRef.close(false);
  }

  public confirm(): void {
    this.matDialogRef.close(true);
  }
}
