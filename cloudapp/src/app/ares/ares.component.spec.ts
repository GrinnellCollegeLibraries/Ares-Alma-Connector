import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AresComponent } from './ares.component';

describe('AresComponent', () => {
  let component: AresComponent;
  let fixture: ComponentFixture<AresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AresComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
