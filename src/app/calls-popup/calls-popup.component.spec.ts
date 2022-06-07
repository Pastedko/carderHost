import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallsPopupComponent } from './calls-popup.component';

describe('CallsPopupComponent', () => {
  let component: CallsPopupComponent;
  let fixture: ComponentFixture<CallsPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CallsPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CallsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
