import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NameGeoobjectDetailViewComponent } from './name-geoobject-detail-view.component';

describe('NameGeoobjectDetailViewComponent', () => {
  let component: NameGeoobjectDetailViewComponent;
  let fixture: ComponentFixture<NameGeoobjectDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NameGeoobjectDetailViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NameGeoobjectDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
