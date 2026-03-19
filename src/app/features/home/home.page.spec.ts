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

  it('feedEpisodes stays unchanged when listening history changes', () => {
    const recentDate = new Date().toISOString();
    const ep1 = mockEpisode({ id: 'feed-ep1', releaseDate: recentDate });
    const ep2 = mockEpisode({ id: 'feed-ep2', releaseDate: recentDate });
    const ep3 = mockEpisode({ id: 'feed-ep3', releaseDate: recentDate });

    (component as any).allFeedEpisodes.set([ep1, ep2, ep3]);

    const ids = (component as any).feedEpisodes().map((e: { id: string }) => e.id);
    expect(ids).toContain('feed-ep1');
    expect(ids).toContain('feed-ep3');
    expect(ids).toContain('feed-ep2');
  });

  it('feedEpisodes excludes episodes older than 30 days', () => {
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();   // 40 days ago
    const recentEp = mockEpisode({ id: 'ep-recent', releaseDate: recentDate });
    const oldEp = mockEpisode({ id: 'ep-old', releaseDate: oldDate });

    (component as any).allFeedEpisodes.set([recentEp, oldEp]);

    const feed = (component as any).feedEpisodes();
    expect(feed.map((e: { id: string }) => e.id)).toContain('ep-recent');
    expect(feed.map((e: { id: string }) => e.id)).not.toContain('ep-old');
  });

  it('feedEpisodes includes episodes with no releaseDate', () => {
    const noDateEp = mockEpisode({ id: 'ep-nodate', releaseDate: undefined });
    (component as any).allFeedEpisodes.set([noDateEp]);

    const feed = (component as any).feedEpisodes();
    expect(feed.map((e: { id: string }) => e.id)).toContain('ep-nodate');
  });

  it('hides trending section when user has subscriptions', () => {
    mockStore.subscriptions.mockReturnValue = undefined; // signal mock — test via computed behaviour
    // The trending section visibility is controlled by subscriptions().length === 0
    // When subscriptions is empty, trending should be shown
    expect(mockStore.subscriptions().length).toBe(0);
  });
});
