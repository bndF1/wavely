jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../../../environments/environment', () => ({
  environment: { appVersion: '0.0.0-test', production: false },
}), { virtual: true });

import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LibraryPage } from './library.page';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { AuthStore } from '../../store/auth/auth.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { HistorySyncService } from '../../core/services/history-sync.service';
import { HistoryStore } from '../../store/history/history.store';
import { ThemeService } from '../../core/services/theme.service';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('LibraryPage', () => {
  let fixture: ComponentFixture<LibraryPage>;
  let component: LibraryPage;

  const mockStore = { subscriptions: signal([]) };
  const mockAuthStore = { user: signal({ uid: 'uid-1' }), signOut: jest.fn().mockResolvedValue(undefined) };
  const mockHistoryStore = {
    entries: signal([]),
    filteredEntries: signal([]),
    isLoading: signal(false),
    activeFilter: signal<'all' | 'unplayed' | 'inProgress' | 'completed'>('all'),
    setLoading: jest.fn(),
    setEntries: jest.fn(),
    clear: jest.fn(),
    setFilter: jest.fn(),
    markPlayed: jest.fn(),
    markUnplayed: jest.fn(),
  };
  const mockThemeService = { mode: signal<'system' | 'light' | 'dark'>('system'), setMode: jest.fn() };
  const mockSyncService = { removeSubscription: jest.fn() };
  const mockHistorySyncService = {
    loadHistory: jest.fn().mockResolvedValue([]),
    clearHistory: jest.fn().mockResolvedValue(undefined),
    updateEntry: jest.fn().mockResolvedValue(undefined),
  };
  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryPage],
      providers: [
        { provide: PodcastsStore, useValue: mockStore },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: SubscriptionSyncService, useValue: mockSyncService },
        { provide: HistorySyncService, useValue: mockHistorySyncService },
        { provide: HistoryStore, useValue: mockHistoryStore },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(LibraryPage, { set: { template: '<div></div>', imports: [] } }).compileComponents();

    fixture = TestBed.createComponent(LibraryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('loads history on init', () => {
    expect(mockHistoryStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockHistorySyncService.loadHistory).toHaveBeenCalledWith('uid-1');
  });

  it('selectFilter delegates to historyStore.setFilter', () => {
    (component as any).selectFilter('completed');
    expect(mockHistoryStore.setFilter).toHaveBeenCalledWith('completed');
  });

  it('markPlayed updates store and sync service', async () => {
    await (component as any).markPlayed('ep-1');

    expect(mockHistoryStore.markPlayed).toHaveBeenCalledWith('ep-1');
    expect(mockHistorySyncService.updateEntry).toHaveBeenCalledWith('ep-1', { completed: true }, 'uid-1');
  });

  it('markUnplayed updates store and sync service', async () => {
    await (component as any).markUnplayed('ep-1');

    expect(mockHistoryStore.markUnplayed).toHaveBeenCalledWith('ep-1');
    expect(mockHistorySyncService.updateEntry).toHaveBeenCalledWith(
      'ep-1',
      { completed: false, position: 0 },
      'uid-1'
    );
  });

  it('delegates unsubscribe and signOut behaviors', async () => {
    const podcast = mockPodcast({ id: 'pod-1' });
    const slidingItem = { close: jest.fn() } as any;

    (component as any).unsubscribe(podcast, slidingItem);
    await (component as any).signOut();

    expect(slidingItem.close).toHaveBeenCalled();
    expect(mockSyncService.removeSubscription).toHaveBeenCalledWith('pod-1', 'uid-1');
    expect(mockAuthStore.signOut).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
