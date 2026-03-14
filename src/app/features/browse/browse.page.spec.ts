import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { BrowsePage, PODCAST_CATEGORIES } from './browse.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('BrowsePage', () => {
  let fixture: ComponentFixture<BrowsePage>;
  let component: BrowsePage;

  const mockApi = {
    getTrendingPodcasts: jest.fn((limit: number) =>
      of([mockPodcast({ id: `pod-${limit}` })])
    ),
  };
  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowsePage],
      providers: [
        { provide: PodcastApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(BrowsePage, { set: { template: '<div></div>', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(BrowsePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates and loads all browse sections for the default category', () => {
    expect(component).toBeTruthy();
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25);
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(5);
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(10);
  });

  it('navigates to category detail for non-all category chips', () => {
    const allCallsBeforeSelect = mockApi.getTrendingPodcasts.mock.calls.length;

    (component as any).selectCategory(PODCAST_CATEGORIES[1]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/browse/category',
      PODCAST_CATEGORIES[1].id,
    ]);
    expect(mockApi.getTrendingPodcasts.mock.calls.length).toBe(allCallsBeforeSelect);
  });

  it('reloads in-page sections when switching back to all category', () => {
    const allCategory = PODCAST_CATEGORIES[0];
    const categoryDetail = PODCAST_CATEGORIES[1];

    (component as any).selectCategory(categoryDetail);
    (component as any).selectCategory(allCategory);

    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25);
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(5);
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(10);
  });

  it('navigates to podcast detail', () => {
    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-9' }));

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/podcast', 'pod-9']);
  });
});
