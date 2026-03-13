jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { TabsComponent } from './tabs.component';
import { PlayerStore } from '../../store/player/player.store';
import { FullPlayerComponent } from '../player/full-player/full-player.component';

describe('TabsComponent', () => {
  let fixture: ComponentFixture<TabsComponent>;
  let component: TabsComponent;

  const present = jest.fn().mockResolvedValue(undefined);
  const mockModalCtrl = {
    create: jest.fn().mockResolvedValue({ present }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent],
      providers: [
        {
          provide: PlayerStore,
          useValue: {
            currentEpisode: jest.fn(() => null),
            isPlaying: jest.fn(() => false),
            currentTime: jest.fn(() => 0),
            duration: jest.fn(() => 0),
            playbackRate: jest.fn(() => 1),
          },
        },
        { provide: ModalController, useValue: mockModalCtrl },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TabsComponent, { set: { template: '<div></div>', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('opens full player modal', async () => {
    await component.openFullPlayer();

    expect(mockModalCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        component: FullPlayerComponent,
        breakpoints: [0, 1],
        initialBreakpoint: 1,
      })
    );
    expect(present).toHaveBeenCalledTimes(1);
  });
});
