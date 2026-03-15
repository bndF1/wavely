import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { EpisodeDetailPage } from './episode-detail.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { CountryService } from '../../core/services/country.service';
import { PlayerStore } from '../../store/player/player.store';
import { mockEpisode, mockPodcast } from '../../../testing/podcast-fixtures';
import { mockPlayerStore } from '../../../testing/mock-stores';

describe('EpisodeDetailPage', () => {
  let component: EpisodeDetailPage;
  let routeParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let playerStore: ReturnType<typeof mockPlayerStore>;
  let router: { navigate: jest.Mock };

  beforeEach(() => {
    const episode = mockEpisode({ id: 'ep-1', podcastId: 'pod-1' });
    const podcast = mockPodcast({ id: 'pod-1' });
    history.pushState({ episode, podcast }, '');

    routeParamMap$ = new BehaviorSubject(convertToParamMap({ id: 'ep-1' }));
    playerStore = mockPlayerStore();
    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: routeParamMap$.asObservable() } },
        {
          provide: PodcastApiService,
          useValue: {
            lookupPodcast: jest.fn().mockReturnValue(of(podcast)),
            getPodcastEpisodes: jest.fn().mockReturnValue(of([episode])),
          },
        },
        { provide: PlayerStore, useValue: playerStore },
        { provide: CountryService, useValue: { country: signal('us') } },
        { provide: Router, useValue: router },
      ],
    });

    component = TestBed.runInInjectionContext(() => new EpisodeDetailPage());
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates from router navigation state', () => {
    expect(component).toBeTruthy();
    expect(component['episode']()?.id).toBe('ep-1');
    expect(component['podcast']()?.id).toBe('pod-1');
  });

  it('delegates controls to player store', () => {
    component['seekTo'](10);
    component['skipBack']();
    component['skipForward']();

    expect(playerStore.seek).toHaveBeenCalledWith(10);
    expect(playerStore.skipBack).toHaveBeenCalledWith(30);
    expect(playerStore.skipForward).toHaveBeenCalledWith(30);
  });

  it('navigates to podcast', () => {
    component['goToPodcast']();
    expect(router.navigate).toHaveBeenCalledWith(['/podcast', 'pod-1']);
  });

  describe('queue interactions', () => {
    it('isInQueue returns true when current episode is already queued', () => {
      const episode = component['episode']();
      expect(episode).not.toBeNull();

      playerStore.queue.set([mockEpisode({ id: episode!.id })]);

      expect(component['isInQueue']).toBe(true);
    });

    it('addToQueue() includes podcastTitle when adding current episode', () => {
      const podcastTitle = component['podcast']()?.title;

      component['addToQueue']();

      expect(playerStore.addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ep-1',
          podcastTitle,
        })
      );
    });

    it('uses the correct Add to Up Next button label based on queue membership', () => {
      const episode = component['episode']();
      expect(episode).not.toBeNull();

      playerStore.queue.set([]);
      expect(component['isInQueue'] ? 'In Queue' : 'Up Next').toBe('Up Next');

      playerStore.queue.set([mockEpisode({ id: episode!.id })]);
      expect(component['isInQueue'] ? 'In Queue' : 'Up Next').toBe('In Queue');
    });
  });

});
