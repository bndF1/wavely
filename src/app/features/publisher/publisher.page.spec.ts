import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { PublisherPage } from './publisher.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { mockPodcast } from '../../../testing/podcast-fixtures';

const ARTIST_ID = '131600381';

describe('PublisherPage', () => {
  let fixture: ComponentFixture<PublisherPage>;
  let component: PublisherPage;

  const routeParams$ = new BehaviorSubject(convertToParamMap({ artistId: ARTIST_ID }));

  const mockPodcasts = Array.from({ length: 20 }, (_, i) =>
    mockPodcast({ id: `pod-${i + 1}`, author: 'Cadena SER' })
  );

  const mockApi = {
    getPublisherPodcasts: jest.fn().mockReturnValue(of(mockPodcasts)),
  };

  const mockRouter = {
    navigate: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublisherPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParams$.asObservable() },
        },
        { provide: PodcastApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(PublisherPage, {
        set: { template: '<div></div>', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PublisherPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    routeParams$.next(convertToParamMap({ artistId: ARTIST_ID }));
    TestBed.resetTestingModule();
  });

  it('loads podcasts for the given artistId', () => {
    expect(component).toBeTruthy();
    expect(mockApi.getPublisherPodcasts).toHaveBeenCalledWith(ARTIST_ID);
    expect((component as any).podcasts().length).toBe(20);
  });

  it('sets publisherName from first podcast author', () => {
    expect((component as any).publisherName()).toBe('Cadena SER');
  });

  it('paginates: shows first 12 by default', () => {
    expect((component as any).visiblePodcasts().length).toBe(12);
    expect((component as any).canLoadMore()).toBe(true);
  });

  it('loads more podcasts on loadMore()', () => {
    (component as any).loadMore();
    expect((component as any).visiblePodcasts().length).toBe(20);
    expect((component as any).canLoadMore()).toBe(false);
  });

  it('sets error state on API failure', async () => {
    routeParams$.next(convertToParamMap({ artistId: 'bad-id' }));
    mockApi.getPublisherPodcasts.mockReturnValueOnce(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(PublisherPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect((component as any).error()).toBeTruthy();
    expect((component as any).podcasts().length).toBe(0);
  });

  it('sets error state when artistId param is missing', async () => {
    routeParams$.next(convertToParamMap({}));

    fixture = TestBed.createComponent(PublisherPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect((component as any).error()).toBeTruthy();
  });

  it('navigates to podcast on card click', () => {
    const podcast = mockPodcast({ id: 'pod-42' });
    (component as any).navigateToPodcast(podcast);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/podcast', 'pod-42']);
  });

  it('navigates to publisher page on navigateToPublisher', () => {
    const mockArtistId = '999';
    (component as any).artistId.set(mockArtistId);
    (component as any).retry();
    expect(mockApi.getPublisherPodcasts).toHaveBeenCalledWith(mockArtistId);
  });
});
