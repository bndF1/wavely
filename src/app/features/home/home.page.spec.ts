import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { HomePage } from './home.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { CountryService } from '../../core/services/country.service';
import { mockPodcast } from '../../../testing/podcast-fixtures';

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
});
