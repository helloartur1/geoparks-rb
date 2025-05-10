import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersPointsListComponent } from './users-points-list.component';

describe('UsersPointsListComponent', () => {
  let component: UsersPointsListComponent;
  let fixture: ComponentFixture<UsersPointsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersPointsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersPointsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
