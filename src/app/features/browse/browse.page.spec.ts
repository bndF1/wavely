import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular/standalone';
import { of } from 'rxjs';

import { BrowsePage, PODCAST_CATEGORIES } from './browse.page';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { CountryService } from '../../core/services/country.service';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('BrowsePage', () => {
  let fixture: ComponentFixture<BrowsePage>;
  let component: BrowsePage;

  const mockApi = {
    getTrendingPodcasts: jest.fn((limit: number) =>
      of([mockPodcast({ id: `pod-${limit}` })])
    ),
    detectCountry: jest.fn(() => 'us'),
  };
  const mockRouter = { navigate: jest.fn() };
  const mockCountryService = {
    country: signal('us'),
    setCountry: jest.fn(),
    getFlag: jest.fn(() => '🇺🇸'),
  };
  const mockActionSheetCtrl = {
    create: jest.fn().mockResolvedValue({ present: jest.fn() }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowsePage],
      providers: [
        { provide: PodcastApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter },
        { provide: CountryService, useValue: mockCountryService },
        { provide: ActionSheetController, useValue: mockActionSheetCtrl },
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
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25, undefined, 'us');
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(5, 1489, 'us');
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(10, 1318, 'us');
  });

  it('navigates to category detail for non-all category chips without making extra API calls', () => {
    const allCallsBeforeSelect = mockApi.getTrendingPodcasts.mock.calls.length;

    (component as any).selectCategory(PODCAST_CATEGORIES[1]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/browse/category',
      PODCAST_CATEGORIES[1].id,
    ]);
    // Bug fix: selecting a category now only navigates — no extra API calls.
    expect(mockApi.getTrendingPodcasts.mock.calls.length).toBe(allCallsBeforeSelect);
  });

  it('reloads in-page sections when switching back to all category', () => {
    mockApi.getTrendingPodcasts.mockClear();

    const allCategory = PODCAST_CATEGORIES[0];
    const categoryDetail = PODCAST_CATEGORIES[1];

    (component as any).selectCategory(categoryDetail);
    (component as any).selectCategory(allCategory);

    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(25, undefined, 'us');
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(5, 1489, 'us');
    expect(mockApi.getTrendingPodcasts).toHaveBeenCalledWith(10, 1318, 'us');
  });

  it('navigates to podcast detail', () => {
    (component as any).navigateToPodcast(mockPodcast({ id: 'pod-9' }));

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/podcast', 'pod-9']);
  });

  it('presentCountryPicker opens action sheet and sets country on selection', async () => {
    const mockPresent = jest.fn().mockResolvedValue(undefined);
    let capturedHandler: (() => void) | undefined;

    mockActionSheetCtrl.create.mockImplementationOnce(async (opts: { buttons: { handler?: () => void; role?: string; text?: string }[] }) => {
      capturedHandler = opts.buttons.find((b) => b.text?.includes('United States'))?.handler;
      return { present: mockPresent };
    });

    await (component as any).presentCountryPicker();

    expect(mockActionSheetCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({ header: 'Browse by Country' })
    );
    expect(mockPresent).toHaveBeenCalled();

    capturedHandler?.();
    expect(mockCountryService.setCountry).toHaveBeenCalledWith('us');
  });
});
