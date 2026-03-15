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

import { PodcastDetailPage } from './podcast-detail.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PlayerStore } from '../../store/player/player.store';
import { AuthStore } from '../../store/auth/auth.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { mockEpisode, mockPodcast } from '../../../testing/podcast-fixtures';
import {
  mockPlayerStore,
  mockPodcastsStore as createMockPodcastsStore,
  mockAuthStore,
} from '../../../testing/mock-stores';

describe('PodcastDetailPage', () => {
  let fixture: ComponentFixture<PodcastDetailPage>;
  let component: PodcastDetailPage;
  let podcast: ReturnType<typeof mockPodcast>;
  let episodes: ReturnType<typeof mockEpisode>[];
  let mockApi: {
    lookupPodcast: jest.Mock;
    getPodcastEpisodes: jest.Mock;
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
        { provide: PodcastsStore, useValue: mockPodcastsStore },
        { provide: PlayerStore, useValue: mockPlayer },
        { provide: AuthStore, useValue: mockAuth },
        { provide: SubscriptionSyncService, useValue: mockSyncService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(PodcastDetailPage, {
        set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

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
    expect(mockApi.lookupPodcast).toHaveBeenCalledWith('pod-1');
    expect(mockApi.getPodcastEpisodes).toHaveBeenCalledWith('pod-1', 200);
    expect(component['podcast']?.id).toBe('pod-1');
    expect(component['episodes']).toHaveLength(2);
  });

  it('sets independent error messages when API calls fail', async () => {
    const podcastErr = throwError(() => new Error('podcast failed'));
    const episodesErr = throwError(() => new Error('episodes failed'));
    // retry(2) means 3 total attempts — mock all three
    mockApi.lookupPodcast
      .mockReturnValueOnce(podcastErr)
      .mockReturnValueOnce(podcastErr)
      .mockReturnValueOnce(podcastErr);
    mockApi.getPodcastEpisodes
      .mockReturnValueOnce(episodesErr)
      .mockReturnValueOnce(episodesErr)
      .mockReturnValueOnce(episodesErr);

    await createComponent();

    expect(component['podcastError']).toBe('Could not load podcast info.');
    expect(component['episodesError']).toBe('Could not load episodes.');
    expect(component['isLoading']).toBe(false);
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

  it('plays selected episode, queues upcoming episodes, and navigates with state', async () => {
    await createComponent();

    component['playEpisode'](episodes[0]);

    expect(mockPlayer.clearQueue).toHaveBeenCalledTimes(1);
    expect(mockPlayer.addToQueue).toHaveBeenCalledWith({ ...episodes[1], podcastTitle: podcast.title });
    expect(mockPlayer.play).toHaveBeenCalledWith({ ...episodes[0], podcastTitle: podcast.title });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/episode', 'ep-1'], {
      state: { episode: { ...episodes[0], podcastTitle: podcast.title }, podcast },
    });
  });

  it('does nothing on playEpisode when podcast is null', async () => {
    await createComponent();
    component['podcast'] = null;

    component['playEpisode'](episodes[0]);

    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('formats duration in seconds, minutes and hours', async () => {
    await createComponent();

    expect(component['formatDuration'](0)).toBe('');
    expect(component['formatDuration'](45)).toBe('45s');
    expect(component['formatDuration'](125)).toBe('2m 5s');
    expect(component['formatDuration'](3900)).toBe('1h 5m');
  });

  it('falls back to default artwork on image error', async () => {
    await createComponent();
    const image = document.createElement('img');

    component['onImageError']({ target: image } as never);

    expect(image.src).toContain('/default-artwork.svg');
  });
});
