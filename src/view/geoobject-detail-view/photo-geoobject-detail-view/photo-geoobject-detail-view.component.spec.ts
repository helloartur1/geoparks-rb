import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoGeoobjectDetailViewComponent } from './photo-geoobject-detail-view.component';

describe('PhotoGeoobjectDetailViewComponent', () => {
  let component: PhotoGeoobjectDetailViewComponent;
  let fixture: ComponentFixture<PhotoGeoobjectDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhotoGeoobjectDetailViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoGeoobjectDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
