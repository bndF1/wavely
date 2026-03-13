import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { SearchPage } from './search.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('SearchPage', () => {
  let fixture: ComponentFixture<SearchPage>;
  let component: SearchPage;
  let api: { searchPodcasts: jest.Mock };
  let router: { navigate: jest.Mock };

  const store = {
    query: signal(''),
    searchResults: signal([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    setQuery: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    setSearchResults: jest.fn(),
  };

  async function createComponent(): Promise<void> {
    api = { searchPodcasts: jest.fn().mockReturnValue(of([mockPodcast({ id: 'search-1' })])) };
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        { provide: PodcastApiService, useValue: api },
        { provide: PodcastsStore, useValue: store },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SearchPage, { set: { template: '<div></div>', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

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
    expect(api.searchPodcasts).toHaveBeenCalledWith('angular');
    expect(store.setSearchResults).toHaveBeenCalledWith(expect.any(Array), 'angular');
  });

  it('clears results when search is cleared', async () => {
    await createComponent();

    (component as any).onSearchClear();
    jest.advanceTimersByTime(300);

    expect(store.setSearchResults).toHaveBeenCalledWith([], '');
  });

  it('navigates to podcast detail', async () => {
    await createComponent();

    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-5' }));

    expect(router.navigate).toHaveBeenCalledWith(['/podcast', 'pod-5']);
  });
});
