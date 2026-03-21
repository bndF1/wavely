jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { EpisodeItemComponent } from './episode-item.component';
import { mockEpisode } from '../../../../testing/podcast-fixtures';
import {
  loadTranslations,
  provideTranslateTesting,
} from '../../../../testing/translate-testing.helper';

describe('EpisodeItemComponent', () => {
  let fixture: ComponentFixture<EpisodeItemComponent>;
  let component: EpisodeItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeItemComponent],
      providers: [...provideTranslateTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(EpisodeItemComponent, {
        set: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    loadTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(EpisodeItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('episode', mockEpisode({ id: 'ep-1', podcastId: 'pod-1' }));
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('formats duration in seconds, minutes and hours', () => {
    expect(component['formatDuration'](0)).toBe('');
    expect(component['formatDuration'](45)).toBe('45s');
    expect(component['formatDuration'](125)).toBe('2m 5s');
    expect(component['formatDuration'](3900)).toBe('1h 5m');
  });

  it('emits episodePlay when play is triggered', () => {
    const ep = mockEpisode({ id: 'ep-1', podcastId: 'pod-1' });
    fixture.componentRef.setInput('episode', ep);
    fixture.detectChanges();

    const played: typeof ep[] = [];
    component.episodePlay.subscribe((e) => played.push(e));

    component['emitPlay']();

    expect(played).toHaveLength(1);
    expect(played[0].id).toBe('ep-1');
  });

  it('falls back to default artwork on image error', () => {
    const image = document.createElement('img');
    component['onImageError']({ target: image } as never);
    expect(image.src).toContain('/default-artwork.svg');
  });

  describe('emitQueue', () => {
    let mockEvent: Event;

    beforeEach(() => {
      jest.useFakeTimers();
      mockEvent = { stopPropagation: jest.fn() } as unknown as Event;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('emits addToQueue with the current episode', () => {
      const ep = mockEpisode({ id: 'ep-2', podcastId: 'pod-1' });
      fixture.componentRef.setInput('episode', ep);
      fixture.detectChanges();

      const queued: typeof ep[] = [];
      component.addToQueue.subscribe((e) => queued.push(e));

      component['emitQueue'](mockEvent);

      expect(queued).toHaveLength(1);
      expect(queued[0].id).toBe('ep-2');
    });

    it('calls stopPropagation on the event', () => {
      component['emitQueue'](mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('sets justAdded to true immediately', () => {
      component['emitQueue'](mockEvent);
      expect(component.justAdded()).toBe(true);
    });

    it('resets justAdded to false after 2000ms', () => {
      component['emitQueue'](mockEvent);
      expect(component.justAdded()).toBe(true);

      jest.advanceTimersByTime(2000);

      expect(component.justAdded()).toBe(false);
    });

    it('does not reset justAdded before 2000ms', () => {
      component['emitQueue'](mockEvent);
      jest.advanceTimersByTime(1999);
      expect(component.justAdded()).toBe(true);

      jest.advanceTimersByTime(1);
      expect(component.justAdded()).toBe(false);
    });
  });
});
