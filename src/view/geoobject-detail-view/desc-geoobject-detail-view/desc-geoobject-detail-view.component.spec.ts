import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescGeoobjectDetailViewComponent } from './desc-geoobject-detail-view.component';

describe('DescGeoobjectDetailViewComponent', () => {
  let component: DescGeoobjectDetailViewComponent;
  let fixture: ComponentFixture<DescGeoobjectDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DescGeoobjectDetailViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescGeoobjectDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
