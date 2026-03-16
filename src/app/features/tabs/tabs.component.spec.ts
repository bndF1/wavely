jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TabsComponent } from './tabs.component';
import { PlayerStore } from '../../store/player/player.store';

describe('TabsComponent', () => {
  let fixture: ComponentFixture<TabsComponent>;
  let component: TabsComponent;

  const mockRouter = { navigate: jest.fn() };

  const mockPlayerStore = {
    currentEpisode: jest.fn(() => null),
    isPlaying: jest.fn(() => false),
    currentTime: jest.fn(() => 0),
    duration: jest.fn(() => 0),
    playbackRate: jest.fn(() => 1),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent],
      providers: [
        { provide: PlayerStore, useValue: mockPlayerStore },
        { provide: Router, useValue: mockRouter },
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

  it('navigates to episode detail when opening full player', () => {
    mockPlayerStore.currentEpisode.mockReturnValue({ id: 'ep-123', title: 'Test' });
    component.openFullPlayer();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/episode', 'ep-123']);
  });

  it('does not navigate when no episode is playing', () => {
    mockPlayerStore.currentEpisode.mockReturnValue(null);
    component.openFullPlayer();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
