import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordForLobbyComponent } from './password-for-lobby.component';

describe('PasswordForLobbyComponent', () => {
  let component: PasswordForLobbyComponent;
  let fixture: ComponentFixture<PasswordForLobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PasswordForLobbyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordForLobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
