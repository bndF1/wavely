// PodcastDetail imports AuthStore -> AuthService -> @angular/fire/auth
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { DatePipe } from '@angular/common';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { PodcastDetailPage } from './podcast-detail.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { CountryService } from '../../core/services/country.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PlayerStore } from '../../store/player/player.store';
import { AuthStore } from '../../store/auth/auth.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { PlayerModalService } from '../../core/services/player-modal.service';
import { mockEpisode, mockPodcast } from '../../../testing/podcast-fixtures';
import {
  mockPlayerStore,
  mockPodcastsStore as createMockPodcastsStore,
  mockAuthStore,
} from '../../../testing/mock-stores';
import {
  loadTranslations,
  provideTranslateTesting,
} from '../../../testing/translate-testing.helper';

describe('PodcastDetailPage', () => {
  let fixture: ComponentFixture<PodcastDetailPage>;
  let component: PodcastDetailPage;
  let podcast: ReturnType<typeof mockPodcast>;
  let episodes: ReturnType<typeof mockEpisode>[];
  let mockApi: {
    lookupPodcast: jest.Mock;
    getPodcastEpisodes: jest.Mock;
    getEpisodesFromRss: jest.Mock;
  };
  let mockPodcastsStore: ReturnType<typeof createMockPodcastsStore>;
  let mockPlayer: ReturnType<typeof mockPlayerStore>;
  let mockAuth: ReturnType<typeof mockAuthStore>;
  let mockSyncService: {
    removeSubscription: jest.Mock;
    addSubscription: jest.Mock;
  };
  let mockRouter: { navigate: jest.Mock; events: ReturnType<typeof of> };

  async function createComponent(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PodcastDetailPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'pod-1' })) },
        },
        { provide: PodcastApiService, useValue: mockApi },
        { provide: CountryService, useValue: { country: signal('us') } },
        { provide: PodcastsStore, useValue: mockPodcastsStore },
        { provide: PlayerStore, useValue: mockPlayer },
        { provide: AuthStore, useValue: mockAuth },
        { provide: SubscriptionSyncService, useValue: mockSyncService },
        { provide: Router, useValue: mockRouter },
        { provide: PlayerModalService, useValue: { open: jest.fn().mockResolvedValue(undefined) } },
        ...provideTranslateTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(PodcastDetailPage, {
        set: { imports: [DatePipe, TranslatePipe], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    loadTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(PodcastDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    podcast = mockPodcast({ id: 'pod-1' });
    episodes = [
      mockEpisode({ id: 'ep-1', podcastId: 'pod-1' }),
      mockEpisode({ id: 'ep-2', podcastId: 'pod-1' }),
    ];
    mockApi = {
      lookupPodcast: jest.fn().mockReturnValue(of(podcast)),
      getPodcastEpisodes: jest.fn().mockReturnValue(of(episodes)),
      // By default, RSS succeeds — callers won't fall back to iTunes
      getEpisodesFromRss: jest.fn().mockReturnValue(of(episodes)),
    };
    mockPodcastsStore = createMockPodcastsStore();
    mockPlayer = mockPlayerStore();
    mockAuth = mockAuthStore({ uid: 'uid-1' });
    mockSyncService = {
      removeSubscription: jest.fn(),
      addSubscription: jest.fn(),
    };
    mockRouter = { navigate: jest.fn(), events: of() };
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully and loads podcast + episodes', async () => {
    await createComponent();

    expect(component).toBeTruthy();
    expect(mockApi.lookupPodcast).toHaveBeenCalledWith('pod-1', 'us');
    // RSS feed is tried first (podcast has a feedUrl); iTunes fallback is skipped
    expect(mockApi.getEpisodesFromRss).toHaveBeenCalledWith(podcast.feedUrl, 'pod-1');
    expect(mockApi.getPodcastEpisodes).not.toHaveBeenCalled();
    expect(component['podcast']?.id).toBe('pod-1');
    expect(component['episodes']).toHaveLength(2);
  });

  it('falls back to iTunes when RSS returns no episodes', async () => {
    mockApi.getEpisodesFromRss.mockReturnValue(of([]));
    await createComponent();

    expect(mockApi.getEpisodesFromRss).toHaveBeenCalled();
    expect(mockApi.getPodcastEpisodes).toHaveBeenCalledWith('pod-1', 200, 'us');
    expect(component['episodes']).toHaveLength(2);
  });

  it('sets independent error messages when API calls fail', async () => {
    // retry({ count: 2, delay: 1000 }) means real timers are involved — use fake timers
    jest.useFakeTimers();
    try {
      mockApi.lookupPodcast.mockReturnValue(throwError(() => new Error('podcast failed')));
      // lookupPodcast fails → podcast is null → no feedUrl → falls back to iTunes
      mockApi.getPodcastEpisodes.mockReturnValue(throwError(() => new Error('episodes failed')));

      await createComponent();
      // Advance past all retry delays (2 retries × 1000ms × 2 API calls = 4 s)
      await jest.runAllTimersAsync();

      expect(component['podcastError']).toBe('Could not load podcast info.');
      expect(component['episodesError']).toBe('Could not load episodes.');
      expect(component['isLoading']).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('adds subscription when not currently subscribed', async () => {
    await createComponent();

    component['toggleSubscription']();
    expect(mockSyncService.addSubscription).toHaveBeenCalledWith(podcast, 'uid-1');
  });

  it('removes subscription when already subscribed', async () => {
    mockPodcastsStore.subscriptions = signal([podcast]);
    await createComponent();

    component['toggleSubscription']();

    expect(mockSyncService.removeSubscription).toHaveBeenCalledWith('pod-1', 'uid-1');
  });

  it('does nothing when toggling subscription without loaded podcast', async () => {
    await createComponent();
    component['podcast'] = null;

    component['toggleSubscription']();

    expect(mockSyncService.addSubscription).not.toHaveBeenCalled();
    expect(mockSyncService.removeSubscription).not.toHaveBeenCalled();
  });

  it('plays selected episode, queues upcoming episodes, and opens full player modal', async () => {
    await createComponent();
    const playerModal = TestBed.inject(PlayerModalService) as jest.Mocked<PlayerModalService>;

    component['playEpisode'](episodes[0]);

    expect(mockPlayer.clearQueue).toHaveBeenCalledTimes(1);
    expect(mockPlayer.addToQueue).toHaveBeenCalledWith({ ...episodes[1], podcastTitle: podcast.title });
    expect(mockPlayer.play).toHaveBeenCalledWith({ ...episodes[0], podcastTitle: podcast.title });
    await Promise.resolve();
    expect(playerModal.open).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(expect.arrayContaining(['/episode']));
  });

  it('does nothing on playEpisode when podcast is null', async () => {
    await createComponent();
    component['podcast'] = null;

    component['playEpisode'](episodes[0]);

    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('falls back to default artwork on image error', async () => {
    await createComponent();
    const image = document.createElement('img');

    component['onImageError']({ target: image } as never);

    expect(image.src).toContain('/default-artwork.svg');
  });
});
