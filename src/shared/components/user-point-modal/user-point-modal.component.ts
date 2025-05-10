import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { GeoparksService } from '@api';
import { CoordinatesType } from '@core';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'geo-user-point-modal',
  templateUrl: './user-point-modal.component.html',
  styleUrls: ['./user-point-modal.component.scss']
})
export class UserPointModalComponent implements OnInit {
  pointType: string = '';
  comment: string = '';
  currentCoordinates: CoordinatesType | null = null;
  pathphoto: string = ''; // Здесь будет храниться путь к фото
  selectedFiles: File[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<UserPointModalComponent>,
    private geoparksService: GeoparksService,
    private activatedRoute: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: { geoparkId: string, coordinates?: CoordinatesType }
  ) {}

  ngOnInit(): void {
    if (this.data?.coordinates && this.data.coordinates.latitude !== 0 && this.data.coordinates.longitude !== 0) {
      this.currentCoordinates = this.data.coordinates;
    } else {
      this.getCurrentLocation();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...Array.from(input.files)];
      
      // Сохраняем путь к первому выбранному файлу
      if (this.selectedFiles.length > 0) {
        this.pathphoto = this.selectedFiles[0].name; // Или полный путь, если нужно
      }
      
      input.value = '';
    }
  }

  async save(): Promise<void> {
    if (!this.pointType || !this.currentCoordinates) {
      alert('Заполните все обязательные поля');
      return;
    }

    // Если нужно загрузить файлы на сервер перед сохранением:
    // const uploadedPhotos = await this.uploadPhotos();

    const payload = {
      id: uuidv4(),
      Type: this.pointType,
      Comment: this.comment,
      latitude: this.currentCoordinates.latitude,
      longitude: this.currentCoordinates.longitude,
      geoparkid: this.data.geoparkId,
      pathphoto: this.pathphoto // Добавляем путь к фото
    };

    this.geoparksService.createUserPointGeoparksGeoparkIdPost(this.data.geoparkId, payload)
      .subscribe({
        next: (response) => {
          console.log('Точка успешно сохранена!', response);
          this.dialogRef.close({ action: 'save', success: true });
        },
        error: (error) => {
          console.error('Ошибка при сохранении точки:', error);
          alert('Ошибка при сохранении точки. Попробуйте ещё раз.');
        }
      });
  }

  // Метод для загрузки фото на сервер (если требуется)
  private async uploadPhotos(): Promise<string[]> {
    const uploadedPaths: string[] = [];
    
    // Здесь должна быть логика загрузки файлов на сервер
    // Например:
    // for (const file of this.selectedFiles) {
    //   const path = await this.uploadService.uploadFile(file);
    //   uploadedPaths.push(path);
    // }
    
    return uploadedPaths;
  }

  // Остальные методы без изменений
  cancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  changeLocation(): void {
    this.dialogRef.close({ 
      action: 'change_location',
      currentCoordinates: this.currentCoordinates
    });
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        },
        (error) => {
          console.error('Ошибка при получении геолокации:', error);
        }
      );
    } else {
      console.warn('Геолокация не поддерживается этим браузером.');
    }
  }
}