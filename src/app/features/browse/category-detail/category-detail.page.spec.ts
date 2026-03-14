import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { CategoryDetailPage } from './category-detail.page';
import { PodcastApiService } from '../../../core/services/podcast-api.service';
import { mockPodcast } from '../../../../testing/podcast-fixtures';

describe('CategoryDetailPage', () => {
  let fixture: ComponentFixture<CategoryDetailPage>;
  let component: CategoryDetailPage;

  const routeParams$ = new BehaviorSubject(convertToParamMap({ genreId: '1489' }));

  const mockApi = {
    getTrendingPodcasts: jest.fn().mockReturnValue(
      of(
        Array.from({ length: 35 }, (_, index) =>
          mockPodcast({ id: `pod-${index + 1}` })
        )
      )
    ),
  };

  const mockRouter = {
    navigate: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryDetailPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams$.asObservable(),
          },
        },
        { provide: PodcastApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(CategoryDetailPage, {
        set: { template: '<div></div>', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CategoryDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    routeParams$.next(convertToParamMap({ genreId: '1489' }));
    TestBed.resetTestingModule();
  });

  it('loads podcasts for route genreId and maps category name', () => {
    expect(component).toBeTruthy();
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(50, 1489);
    expect((component as any).genreName()).toBe('News');
  });

  it('reacts to route param changes', () => {
    routeParams$.next(convertToParamMap({ genreId: '1304' }));

    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(50, 1304);
    expect((component as any).genreName()).toBe('Education');
  });

  it('supports client-side load more pagination', () => {
    expect((component as any).visiblePodcasts().length).toBe(12);
    expect((component as any).canLoadMore()).toBe(true);

    (component as any).loadMore();

    expect((component as any).visiblePodcasts().length).toBe(24);
    expect((component as any).canLoadMore()).toBe(true);

    (component as any).loadMore();

    expect((component as any).visiblePodcasts().length).toBe(35);
    expect((component as any).canLoadMore()).toBe(false);
  });

  it('navigates to podcast detail when selecting a podcast', () => {
    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-99' }));

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/podcast', 'pod-99']);
  });
});
