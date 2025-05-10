import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPointModalComponent } from './user-point-modal.component';

describe('UserPointModalComponent', () => {
  let component: UserPointModalComponent;
  let fixture: ComponentFixture<UserPointModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserPointModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPointModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
