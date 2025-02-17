import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemRoutesComponent } from './system-routes.component';

describe('SystemRoutesComponent', () => {
  let component: SystemRoutesComponent;
  let fixture: ComponentFixture<SystemRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemRoutesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
