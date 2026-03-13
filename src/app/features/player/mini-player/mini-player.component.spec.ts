import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MiniPlayerComponent } from './mini-player.component';
import { PlayerStore } from '../../../store/player/player.store';
import { mockPlayerStore } from '../../../../testing/mock-stores';
import { mockEpisode } from '../../../../testing/podcast-fixtures';

describe('MiniPlayerComponent', () => {
  let component: MiniPlayerComponent;
  let fixture: ComponentFixture<MiniPlayerComponent>;
  let store: ReturnType<typeof mockPlayerStore>;

  function createComponent(storeOverrides = {}): void {
    store = mockPlayerStore(storeOverrides);

    TestBed.configureTestingModule({
      imports: [MiniPlayerComponent],
      providers: [{ provide: PlayerStore, useValue: store }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MiniPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  describe('progressValue', () => {
    it('returns 0 when duration is 0', () => {
      createComponent({ currentTime: 0, duration: 0 });
      expect(component.progressValue).toBe(0);
    });

    it('returns 0 when duration is negative (guard)', () => {
      createComponent({ currentTime: 10, duration: 0 });
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
  });

  describe('togglePlay()', () => {
    it('calls store.pause() when currently playing', () => {
      createComponent({ isPlaying: true });
      const event = new Event('click');
      component.togglePlay(event);
      expect(store.pause).toHaveBeenCalledTimes(1);
      expect(store.resume).not.toHaveBeenCalled();
    });

    it('calls store.resume() when currently paused', () => {
      createComponent({ isPlaying: false });
      const event = new Event('click');
      component.togglePlay(event);
      expect(store.resume).toHaveBeenCalledTimes(1);
      expect(store.pause).not.toHaveBeenCalled();
    });

    it('stops event propagation', () => {
      createComponent({ isPlaying: false });
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.togglePlay(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('close()', () => {
    it('calls store.close()', () => {
      createComponent();
      const event = new Event('click');
      component.close(event);
      expect(store.close).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation', () => {
      createComponent();
      const event = { stopPropagation: jest.fn() } as unknown as Event;
      component.close(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('store integration', () => {
    it('reflects episode from store', () => {
      const episode = mockEpisode({ id: 'ep-test' });
      createComponent({ currentEpisode: episode });
      expect(component.store.currentEpisode()).toEqual(episode);
    });
  });
});
