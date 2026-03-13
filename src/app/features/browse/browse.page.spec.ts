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
    getTrendingPodcasts: jest.fn().mockReturnValue(of([mockPodcast({ id: 'pod-1' })])),
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

  it('creates and loads initial category', () => {
    expect(component).toBeTruthy();
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25);
  });

  it('changes category and navigates to podcast detail', () => {
    (component as any).selectCategory(PODCAST_CATEGORIES[1]);
    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-9' }));

    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25, PODCAST_CATEGORIES[1].id);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/podcast', 'pod-9']);
  });
});
