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
import { mockPodcast, mockEpisode } from '../../../testing/podcast-fixtures';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;

  const mockApi = {
    getTrendingPodcasts: jest.fn().mockReturnValue(of([mockPodcast({ id: 'p1' })])),
    detectCountry: jest.fn(() => 'us'),
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

  it('feedEpisodes excludes episodes whose IDs appear as completed in HistoryStore', () => {
    const recentDate = new Date().toISOString();
    const ep1 = mockEpisode({ id: 'feed-ep1', releaseDate: recentDate });
    const ep2 = mockEpisode({ id: 'feed-ep2', releaseDate: recentDate }); // will be completed
    const ep3 = mockEpisode({ id: 'feed-ep3', releaseDate: recentDate });

    (component as any).allFeedEpisodes.set([ep1, ep2, ep3]);

    const historyStore = TestBed.inject(HistoryStore);
    historyStore.setEntries([
      {
        episodeId: 'feed-ep2',
        podcastId: 'p1',
        completed: true,
        position: 100,
        duration: 100,
        lastPlayedAt: Date.now(),
      },
    ]);

    const ids = (component as any).feedEpisodes().map((e: { id: string }) => e.id);
    expect(ids).toContain('feed-ep1');
    expect(ids).toContain('feed-ep3');
    expect(ids).not.toContain('feed-ep2');
  });
});
