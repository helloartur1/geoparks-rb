import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GeoobjectModel, PhotoService } from '@api';
import { take } from 'rxjs';

interface IPhotoBase {
  id: string;
  path: string;
}
@Component({
  selector: 'geo-marker-info-modal',
  templateUrl: './marker-info-modal.component.html',
  styleUrls: ['./marker-info-modal.component.scss']
})
export class MarkerInfoModalComponent {
  public imagePaths: string[] = [];
  public activeImageIndex: number = 0;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GeoobjectModel, 
    private matDialogRef: MatDialogRef<MarkerInfoModalComponent>,
    private photosService: PhotoService
    ) {}

    public ngOnInit(): void {
      this.photosService.photosByGeoobjectPhotoGeoobjectIdGet(this.data.id).pipe(take(1)).subscribe((photos: IPhotoBase[]) => {
        this.imagePaths = photos.map((photo: IPhotoBase) => photo.path);
      });
    }
    public close(): void {
      this.matDialogRef.close(false);
    }

    public confirm(): void {
      this.matDialogRef.close(true);
    }

    public togglePrevPhoto(evt: MouseEvent): void {
      evt.preventDefault();
      if (this.activeImageIndex > 0) {
        this.activeImageIndex--;
      }
    }

    public getPath(path: string): string {
      return 'http://localhost:8000/' + path; 
    }
    public toggleNextPhoto(evt: MouseEvent): void {
      evt.preventDefault();
      if (this.activeImageIndex < this.imagePaths.length - 1) {
        this.activeImageIndex++;
      }
    }

}
