import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SearchPage } from './search.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { SearchHistoryService } from '../../core/services/search-history.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('SearchPage', () => {
  let fixture: ComponentFixture<SearchPage>;
  let component: SearchPage;
  let api: { searchPodcasts: jest.Mock; detectCountry: jest.Mock };
  let router: { navigate: jest.Mock };
  let searchHistory: { getHistory: jest.Mock; addQuery: jest.Mock; removeQuery: jest.Mock; clearAll: jest.Mock };

  const store = {
    query: signal(''),
    searchQuery: signal(''),
    searchResults: signal([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    setQuery: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    setSearchResults: jest.fn(),
  };

  async function createComponent(): Promise<void> {
    api = {
      searchPodcasts: jest.fn().mockReturnValue(of([mockPodcast({ id: 'search-1' })])),
      detectCountry: jest.fn().mockReturnValue('us'),
    };
    router = { navigate: jest.fn() };
    searchHistory = {
      getHistory: jest.fn().mockReturnValue(['angular']),
      addQuery: jest.fn(),
      removeQuery: jest.fn(),
      clearAll: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        { provide: PodcastApiService, useValue: api },
        { provide: PodcastsStore, useValue: store },
        { provide: SearchHistoryService, useValue: searchHistory },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(SearchPage, { set: { template: '<div></div>', imports: [] } }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('debounces search input and stores search results', async () => {
    await createComponent();
    (component as any).onSearchInput({ detail: { value: 'angular' } } as never);
    jest.advanceTimersByTime(300);

    expect(store.setQuery).toHaveBeenCalledWith('angular');
    expect(api.searchPodcasts).toHaveBeenCalledWith('angular', 'us');
    expect(store.setSearchResults).toHaveBeenCalledWith(expect.any(Array), 'angular');
  });

  it('calls addQuery after successful search', async () => {
    await createComponent();
    (component as any).onSearchInput({ detail: { value: 'rxjs' } } as never);
    jest.advanceTimersByTime(300);

    expect(searchHistory.addQuery).toHaveBeenCalledWith('rxjs');
  });

  it('clears results when search is cleared', async () => {
    await createComponent();
    (component as any).onSearchClear();
    jest.advanceTimersByTime(300);

    expect(store.setSearchResults).toHaveBeenCalledWith([], '');
  });

  it('tapping suggestion triggers search', async () => {
    await createComponent();
    (component as any).useSuggestion('ionic');
    jest.advanceTimersByTime(300);

    expect(store.setQuery).toHaveBeenCalledWith('ionic');
    expect(api.searchPodcasts).toHaveBeenCalledWith('ionic', 'us');
  });

  it('navigates to podcast detail', async () => {
    await createComponent();
    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-5' }));

    expect(router.navigate).toHaveBeenCalledWith(['/podcast', 'pod-5']);
  });
});
