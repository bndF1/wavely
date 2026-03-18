// FullPlayerComponent imports AudioService → AuthStore → AuthService → @angular/fire/auth,
// which calls `fetch` at module load in Jest's Node environment. Mocking prevents the crash.
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FullPlayerComponent } from './full-player.component';
import { PlayerStore } from '../../../store/player/player.store';
import { ModalController, ActionSheetController } from '@ionic/angular/standalone';
import { mockPlayerStore } from '../../../../testing/mock-stores';
import { mockEpisode } from '../../../../testing/podcast-fixtures';
import {
  loadTranslations,
  provideTranslateTesting,
} from '../../../../testing/translate-testing.helper';

describe('FullPlayerComponent', () => {
  let component: FullPlayerComponent;
  let fixture: ComponentFixture<FullPlayerComponent>;
  let store: ReturnType<typeof mockPlayerStore>;
  let mockModalCtrl: { dismiss: jest.Mock };
  let mockActionSheetCtrl: { create: jest.Mock };

  function createComponent(storeOverrides = {}): void {
    store = mockPlayerStore(storeOverrides);
    mockModalCtrl = { dismiss: jest.fn() };
    mockActionSheetCtrl = {
      create: jest.fn().mockResolvedValue({ present: jest.fn() }),
    };

    TestBed.configureTestingModule({
      imports: [FullPlayerComponent],
      providers: [
        { provide: PlayerStore, useValue: store },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: ActionSheetController, useValue: mockActionSheetCtrl },
        ...provideTranslateTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    loadTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(FullPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  describe('progressValue', () => {
    it('returns 0 when duration is 0', () => {
      createComponent({ currentTime: 0, duration: 0 });
      expect(component.progressValue).toBe(0);
    });

    it('returns correct ratio', () => {
      createComponent({ currentTime: 60, duration: 120 });
      expect(component.progressValue).toBeCloseTo(0.5);
    });
  });

  describe('currentTimeLabel', () => {
    it('formats current time as mm:ss', () => {
      createComponent({ currentTime: 90, duration: 3600 });
      expect(component.currentTimeLabel).toBe('1:30');
    });

    it('returns 0:00 at start', () => {
      createComponent({ currentTime: 0, duration: 3600 });
      expect(component.currentTimeLabel).toBe('0:00');
    });
  });

  describe('remainingTimeLabel', () => {
    it('shows negative remaining time', () => {
      createComponent({ currentTime: 60, duration: 120 });
      expect(component.remainingTimeLabel).toBe('-1:00');
    });

    it('shows -0:00 when at the end', () => {
      createComponent({ currentTime: 120, duration: 120 });
      expect(component.remainingTimeLabel).toBe('-0:00');
    });

    it('does not go below -0:00 when time exceeds duration', () => {
      createComponent({ currentTime: 130, duration: 120 });
      expect(component.remainingTimeLabel).toBe('-0:00');
    });
  });

  describe('rateLabel', () => {
    it('shows "1×" for 1x playback', () => {
      createComponent({ playbackRate: 1 });
      expect(component.rateLabel).toBe('1×');
    });

    it('shows multiplier for non-1x speeds', () => {
      createComponent({ playbackRate: 1.5 });
      expect(component.rateLabel).toBe('1.5×');
    });

    it('shows 0.5× for half-speed', () => {
      createComponent({ playbackRate: 0.5 });
      expect(component.rateLabel).toBe('0.5×');
    });
  });

  describe('dismiss()', () => {
    it('calls modalCtrl.dismiss()', () => {
      createComponent();
      component.dismiss();
      expect(mockModalCtrl.dismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('togglePlay()', () => {
    it('calls store.pause() when playing', () => {
      createComponent({ isPlaying: true });
      component.togglePlay();
      expect(store.pause).toHaveBeenCalledTimes(1);
      expect(store.resume).not.toHaveBeenCalled();
    });

    it('calls store.resume() when paused', () => {
      createComponent({ isPlaying: false });
      component.togglePlay();
      expect(store.resume).toHaveBeenCalledTimes(1);
      expect(store.pause).not.toHaveBeenCalled();
    });
  });

  describe('skipBack()', () => {
    it('calls store.skipBack(15)', () => {
      createComponent();
      component.skipBack();
      expect(store.skipBack).toHaveBeenCalledWith(15);
    });
  });

  describe('skipForward()', () => {
    it('calls store.skipForward(30)', () => {
      createComponent();
      component.skipForward();
      expect(store.skipForward).toHaveBeenCalledWith(30);
    });
  });

  describe('showSpeedPicker()', () => {
    it('creates and presents an action sheet', async () => {
      createComponent();
      await component.showSpeedPicker();
      expect(mockActionSheetCtrl.create).toHaveBeenCalledTimes(1);
      const { present } = await mockActionSheetCtrl.create.mock.results[0].value;
      expect(present).toHaveBeenCalledTimes(1);
    });

    it('marks current rate with a checkmark', async () => {
      createComponent({ playbackRate: 1.5 });
      await component.showSpeedPicker();
      const args = mockActionSheetCtrl.create.mock.calls[0][0];
      const selectedBtn = args.buttons.find((b: { text: string }) => b.text.includes('✓'));
      expect(selectedBtn?.text).toContain('1.5');
    });
  });

  describe('onScrubChange()', () => {
    it('calls store.seek() with the computed position', () => {
      createComponent({ currentTime: 0, duration: 100 });
      // Simulate a range event at 50% → should seek to 50s
      const mockEvent = { detail: { value: 50 } } as unknown as Event;
      component.onScrubChange(mockEvent);
      expect(store.seek).toHaveBeenCalledWith(50);
    });
  });

  describe('queue UI', () => {
    it('does not render queue section when queue is empty', () => {
      createComponent({
        currentEpisode: mockEpisode({ id: 'now-playing' }),
        queue: [],
      });

      const queueSection = fixture.nativeElement.querySelector('.full-player__queue');
      expect(queueSection).toBeNull();
    });

    it('renders queue section when queue has items', () => {
      createComponent({
        currentEpisode: mockEpisode({ id: 'now-playing' }),
        queue: [mockEpisode({ id: 'q-1', title: 'Queued Episode' })],
      });

      const queueSection = fixture.nativeElement.querySelector('.full-player__queue');
      expect(queueSection).not.toBeNull();
      expect(queueSection.textContent).toContain('Up Next');
    });

    it('calls store.clearQueue() when Clear is clicked', () => {
      createComponent({
        currentEpisode: mockEpisode({ id: 'now-playing' }),
        queue: [mockEpisode({ id: 'q-1', title: 'Queued Episode' })],
      });

      const clearButton = fixture.nativeElement.querySelector('.full-player__queue-clear') as HTMLButtonElement;
      clearButton.click();

      expect(store.clearQueue).toHaveBeenCalledTimes(1);
    });

    it('calls store.removeFromQueue(episodeId) when Remove is clicked', () => {
      const queued = mockEpisode({ id: 'q-1', title: 'Queued Episode' });
      createComponent({
        currentEpisode: mockEpisode({ id: 'now-playing' }),
        queue: [queued],
      });

      const removeButton = fixture.nativeElement.querySelector('[aria-label="Remove Queued Episode from queue"]') as HTMLButtonElement;
      removeButton.click();

      expect(store.removeFromQueue).toHaveBeenCalledWith('q-1');
    });
  });

});
