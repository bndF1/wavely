// DesktopPlayerComponent imports AudioService → AuthStore → AuthService → @angular/fire/auth,
// which calls `fetch` at module load in Jest's Node environment. Mocking prevents the crash.
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DesktopPlayerComponent } from './desktop-player.component';
import { PlayerStore } from '../../../store/player/player.store';
import { AudioService } from '../../../core/services/audio.service';
import { mockPlayerStore } from '../../../../testing/mock-stores';
import { mockEpisode } from '../../../../testing/podcast-fixtures';
import {
  loadTranslations,
  provideTranslateTesting,
} from '../../../../testing/translate-testing.helper';

describe('DesktopPlayerComponent', () => {
  let component: DesktopPlayerComponent;
  let fixture: ComponentFixture<DesktopPlayerComponent>;
  let store: ReturnType<typeof mockPlayerStore>;

  function createComponent(storeOverrides = {}): void {
    store = mockPlayerStore({
      currentEpisode: mockEpisode({ id: 'ep-1', title: 'Test Episode', podcastId: 'pod-1' }),
      ...storeOverrides,
    });

    TestBed.configureTestingModule({
      imports: [DesktopPlayerComponent],
      providers: [
        { provide: PlayerStore, useValue: store },
        { provide: PLATFORM_ID, useValue: 'browser' },
        ...provideTranslateTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    loadTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(DesktopPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  describe('component creation', () => {
    it('creates successfully', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('injects PlayerStore', () => {
      createComponent();
      expect(component.store).toBeDefined();
    });
  });

  describe('progressValue', () => {
    it('returns 0 when duration is 0', () => {
      createComponent({ currentTime: 0, duration: 0 });
      expect(component.progressValue).toBe(0);
    });

    it('returns 0 when duration is 0 even with non-zero currentTime', () => {
      createComponent({ currentTime: 30, duration: 0 });
      expect(component.progressValue).toBe(0);
    });

    it('returns correct ratio', () => {
      createComponent({ currentTime: 30, duration: 120 });
      expect(component.progressValue).toBeCloseTo(0.25);
    });

    it('returns 1.0 when at full duration', () => {
      createComponent({ currentTime: 3600, duration: 3600 });
      expect(component.progressValue).toBe(1);
    });

    it('returns 0.5 at halfway point', () => {
      createComponent({ currentTime: 60, duration: 120 });
      expect(component.progressValue).toBeCloseTo(0.5);
    });
  });

  describe('currentTimeFormatted', () => {
    it('delegates to AudioService.formatTime', () => {
      createComponent({ currentTime: 90, duration: 300 });
      expect(component.currentTimeFormatted).toBe(AudioService.formatTime(90));
    });

    it('formats 0 as 0:00', () => {
      createComponent({ currentTime: 0, duration: 300 });
      expect(component.currentTimeFormatted).toBe('0:00');
    });

    it('formats minutes and seconds correctly', () => {
      createComponent({ currentTime: 125, duration: 300 });
      expect(component.currentTimeFormatted).toBe('2:05');
    });
  });

  describe('remainingTimeFormatted', () => {
    it('delegates to AudioService.formatTime with a minus prefix', () => {
      createComponent({ currentTime: 30, duration: 120 });
      const remaining = 120 - 30;
      expect(component.remainingTimeFormatted).toBe('-' + AudioService.formatTime(remaining));
    });

    it('clamps remaining to 0 when currentTime exceeds duration', () => {
      createComponent({ currentTime: 150, duration: 120 });
      expect(component.remainingTimeFormatted).toBe('-0:00');
    });

    it('shows full duration remaining at start', () => {
      createComponent({ currentTime: 0, duration: 600 });
      expect(component.remainingTimeFormatted).toBe('-' + AudioService.formatTime(600));
    });
  });

  describe('togglePlay()', () => {
    it('calls store.pause() when currently playing', () => {
      createComponent({ isPlaying: true });
      component.togglePlay();
      expect(store.pause).toHaveBeenCalledTimes(1);
      expect(store.resume).not.toHaveBeenCalled();
    });

    it('calls store.resume() when currently paused', () => {
      createComponent({ isPlaying: false });
      component.togglePlay();
      expect(store.resume).toHaveBeenCalledTimes(1);
      expect(store.pause).not.toHaveBeenCalled();
    });
  });

  describe('onSeek()', () => {
    it('calls store.seek() with correct time', () => {
      createComponent({ currentTime: 0, duration: 200 });
      const mockEvent = { target: { value: '50' } } as unknown as Event;
      component.onSeek(mockEvent);
      // 50% of 200 = 100
      expect(store.seek).toHaveBeenCalledWith(100);
    });

    it('seeks to 0 when value is 0', () => {
      createComponent({ currentTime: 60, duration: 200 });
      const mockEvent = { target: { value: '0' } } as unknown as Event;
      component.onSeek(mockEvent);
      expect(store.seek).toHaveBeenCalledWith(0);
    });

    it('seeks to full duration when value is 100', () => {
      createComponent({ currentTime: 0, duration: 300 });
      const mockEvent = { target: { value: '100' } } as unknown as Event;
      component.onSeek(mockEvent);
      expect(store.seek).toHaveBeenCalledWith(300);
    });
  });

  describe('onVolumeChange()', () => {
    it('calls store.setVolume() with parsed float value', () => {
      createComponent();
      const mockEvent = { target: { value: '0.7' } } as unknown as Event;
      component.onVolumeChange(mockEvent);
      expect(store.setVolume).toHaveBeenCalledWith(0.7);
    });

    it('calls store.setVolume() with 0 for silence', () => {
      createComponent();
      const mockEvent = { target: { value: '0' } } as unknown as Event;
      component.onVolumeChange(mockEvent);
      expect(store.setVolume).toHaveBeenCalledWith(0);
    });

    it('calls store.setVolume() with 1 for max', () => {
      createComponent();
      const mockEvent = { target: { value: '1' } } as unknown as Event;
      component.onVolumeChange(mockEvent);
      expect(store.setVolume).toHaveBeenCalledWith(1);
    });
  });

  describe('setRate()', () => {
    it('calls store.setPlaybackRate() with the given rate', () => {
      createComponent();
      component.setRate(1.5);
      expect(store.setPlaybackRate).toHaveBeenCalledWith(1.5);
    });

    it('calls store.setPlaybackRate() with 0.5', () => {
      createComponent();
      component.setRate(0.5);
      expect(store.setPlaybackRate).toHaveBeenCalledWith(0.5);
    });
  });

  describe('playbackRates', () => {
    it('contains expected rates', () => {
      createComponent();
      expect(component.playbackRates).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
    });
  });
});
