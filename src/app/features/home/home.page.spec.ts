// PlayerModalService -> FullPlayerComponent -> AudioService -> AuthService -> @angular/fire/auth
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { HomePage } from './home.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { CountryService } from '../../core/services/country.service';
import { PlayerModalService } from '../../core/services/player-modal.service';
import { HistoryStore } from '../../store/history/history.store';
import { mockPodcast, mockEpisode, resetCounters } from '../../../testing/podcast-fixtures';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;

  const mockApi = {
    getTrendingPodcasts: jest.fn().mockReturnValue(of([mockPodcast({ id: 'p1' })])),
    detectCountry: jest.fn(() => 'us'),
    getEpisodesFromRss: jest.fn().mockReturnValue(of([])),
    getPodcastEpisodes: jest.fn().mockReturnValue(of([])),
  };
  const mockStore = {
    trending: signal([]),
    subscriptions: signal([]),
    setLoading: jest.fn(),
    setTrending: jest.fn(),
    setError: jest.fn(),
  };
  const mockRouter = { navigate: jest.fn() };
  const mockCountryService = {
    country: signal('us'),
    setCountry: jest.fn(),
    getFlag: jest.fn(() => '🇺🇸'),
  };

  beforeEach(async () => {
    resetCounters();
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: PodcastApiService, useValue: mockApi },
        { provide: PodcastsStore, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: CountryService, useValue: mockCountryService },
        { provide: PlayerModalService, useValue: { open: jest.fn().mockResolvedValue(undefined) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(HomePage, { set: { template: '<div></div>', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates and loads trending on init when empty', () => {
    expect(component).toBeTruthy();
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25, undefined, 'us');
  });

  it('navigates to search and podcast routes', () => {
    (component as any).navigateToSearch();
    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-7' }));

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/discover']);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/podcast', 'pod-7']);
  });

  // --- #256: feed must be date-based only; listening history must not affect it ---

  it('feedEpisodes filters by publish date — episodes within 30 days are shown', () => {
    const recentDate = new Date().toISOString();
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(); // 40 days ago
    const recent = mockEpisode({ id: 'recent', releaseDate: recentDate });
    const old = mockEpisode({ id: 'old', releaseDate: oldDate });

    (component as any).allFeedEpisodes.set([recent, old]);

    const ids = (component as any).feedEpisodes().map((e: { id: string }) => e.id);
    expect(ids).toContain('recent');
    expect(ids).not.toContain('old');
  });

  it('feedEpisodes includes completed episodes — history does not filter the feed (#256)', () => {
    const recentDate = new Date().toISOString();
    const ep1 = mockEpisode({ id: 'feed-ep1', releaseDate: recentDate });
    const ep2 = mockEpisode({ id: 'feed-ep2', releaseDate: recentDate });
    const ep3 = mockEpisode({ id: 'feed-ep3', releaseDate: recentDate });

    (component as any).allFeedEpisodes.set([ep1, ep2, ep3]);

    // Mark ep2 as completed in history
    const historyStore = TestBed.inject(HistoryStore);
    historyStore.setEntries([
      {
        episodeId: 'feed-ep2',
        episodeTitle: 'Test Episode',
        podcastTitle: 'Test Podcast',
        imageUrl: '',
        completed: true,
        position: 100,
        duration: 100,
        lastPlayedAt: Date.now(),
      },
    ]);

    const ids = (component as any).feedEpisodes().map((e: { id: string }) => e.id);
    // All three must appear — listening history does not gate the feed
    expect(ids).toContain('feed-ep1');
    expect(ids).toContain('feed-ep2'); // completed, but still shown in feed
    expect(ids).toContain('feed-ep3');
  });

  it('clearing history does not remove episodes from the feed (#256)', () => {
    const recentDate = new Date().toISOString();
    const ep1 = mockEpisode({ id: 'clr-ep1', releaseDate: recentDate });
    const ep2 = mockEpisode({ id: 'clr-ep2', releaseDate: recentDate });

    (component as any).allFeedEpisodes.set([ep1, ep2]);

    const historyStore = TestBed.inject(HistoryStore);
    historyStore.setEntries([
      {
        episodeId: 'clr-ep1',
        episodeTitle: 'Test',
        podcastTitle: 'Test',
        imageUrl: '',
        completed: true,
        position: 60,
        duration: 60,
        lastPlayedAt: Date.now(),
      },
    ]);

    // Verify both episodes are visible before clearing
    let ids = (component as any).feedEpisodes().map((e: { id: string }) => e.id);
    expect(ids).toContain('clr-ep1');
    expect(ids).toContain('clr-ep2');

    // Clear history — feed must remain unchanged
    historyStore.clear();
    ids = (component as any).feedEpisodes().map((e: { id: string }) => e.id);
    expect(ids).toContain('clr-ep1');
    expect(ids).toContain('clr-ep2');
  });

  // --- #240: subscription change must trigger a feed reload ---

  it('loadFeed snapshots lastLoadedSubIds immediately so effect does not double-fire (#240)', () => {
    mockApi.getPodcastEpisodes.mockReturnValue(of([]));
    mockApi.getEpisodesFromRss.mockReturnValue(of([]));

    const podcast = mockPodcast({ id: 'sub-pod-1' });
    mockStore.subscriptions.set([podcast]);
    fixture.detectChanges();

    // Trigger a load directly — lastLoadedSubIds must be updated before async completes
    void (component as any).loadFeed(true);
    const snapshotted = (component as any).lastLoadedSubIds();
    expect(snapshotted).toBe('sub-pod-1');
  });

  // --- concurrent load guard: force=true while loading queues a follow-up (#253/#240) ---

  it('concurrent force=true loadFeed sets pendingFeedRefresh flag instead of racing', () => {
    mockApi.getPodcastEpisodes.mockReturnValue(of([]));
    mockApi.getEpisodesFromRss.mockReturnValue(of([]));

    const podcast = mockPodcast({ id: 'race-pod', feedUrl: '' });
    mockStore.subscriptions.set([podcast]);
    fixture.detectChanges();

    // Simulate an in-flight load
    (component as any).isFeedLoading.set(true);
    (component as any).pendingFeedRefresh = false;

    // A concurrent force=true call should NOT start a second fetch — just set the flag
    jest.clearAllMocks();
    void (component as any).loadFeed(true);

    expect((component as any).pendingFeedRefresh).toBe(true);
    expect(mockApi.getPodcastEpisodes).not.toHaveBeenCalled();
    expect(mockApi.getEpisodesFromRss).not.toHaveBeenCalled();
  });

  // --- #253: ionViewWillEnter must refresh the feed on every tab visit ---

  it('ionViewWillEnter triggers a fresh feed load on every tab visit (#253)', async () => {
    mockApi.getPodcastEpisodes.mockReturnValue(of([]));
    mockApi.getEpisodesFromRss.mockReturnValue(of([]));

    const podcast = mockPodcast({ id: 'refresh-pod', feedUrl: '' });
    mockStore.subscriptions.set([podcast]);
    fixture.detectChanges();
    await fixture.whenStable();

    // Reset call counts — any previous load from the subscription-change effect is done
    jest.clearAllMocks();
    mockApi.getPodcastEpisodes.mockReturnValue(of([]));
    (component as any).isFeedLoading.set(false);

    (component as any).ionViewWillEnter();

    // A fresh API call must have been issued for the existing subscription
    expect(mockApi.getPodcastEpisodes).toHaveBeenCalledWith('refresh-pod', 20);
  });
});
