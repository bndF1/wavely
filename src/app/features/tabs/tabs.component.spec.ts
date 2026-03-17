jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsComponent } from './tabs.component';
import { PlayerStore } from '../../store/player/player.store';
import { PlayerModalService } from '../../core/services/player-modal.service';

describe('TabsComponent', () => {
  let fixture: ComponentFixture<TabsComponent>;
  let component: TabsComponent;

  const mockPlayerModal = { open: jest.fn().mockResolvedValue(undefined) };
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
        { provide: PlayerModalService, useValue: mockPlayerModal },
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

  it('opens full player when episode is playing', async () => {
    mockPlayerStore.currentEpisode.mockReturnValue({ id: 'ep-123', title: 'Test' });
    await component.openFullPlayer();
    expect(mockPlayerModal.open).toHaveBeenCalledTimes(1);
  });

  it('does not open modal when no episode is playing', async () => {
    mockPlayerStore.currentEpisode.mockReturnValue(null);
    await component.openFullPlayer();
    expect(mockPlayerModal.open).not.toHaveBeenCalled();
  });
});
