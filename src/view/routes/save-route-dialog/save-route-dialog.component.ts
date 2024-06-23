import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'geo-save-route-dialog',
  templateUrl: './save-route-dialog.component.html',
  styleUrls: ['./save-route-dialog.component.scss']
})
export class SaveRouteDialogComponent {
  public routeNameControl: FormControl = new FormControl('');

  constructor(public matDialogRef: MatDialogRef<SaveRouteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  public close(): void {
    this.matDialogRef.close();
  }

  public save(): void {
    this.matDialogRef.close(this.routeNameControl.value);
  }

}
