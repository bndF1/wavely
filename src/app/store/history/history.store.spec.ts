import { TestBed } from '@angular/core/testing';
import { HistoryStore, type HistoryEntry } from './history.store';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  episodeId: 'ep-1',
  episodeTitle: 'Episode 1',
  podcastTitle: 'Podcast 1',
  imageUrl: '/image-1.jpg',
  position: 30,
  duration: 120,
  lastPlayedAt: 1000,
  completed: false,
  ...overrides,
});

describe('HistoryStore', () => {
  let store: InstanceType<typeof HistoryStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [HistoryStore] });
    store = TestBed.inject(HistoryStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('has expected initial state', () => {
    expect(store.entries()).toEqual([]);
    expect(store.isLoading()).toBe(false);
  });

  it('setLoading updates loading state', () => {
    store.setLoading(true);
    expect(store.isLoading()).toBe(true);

    store.setLoading(false);
    expect(store.isLoading()).toBe(false);
  });

  it('setEntries replaces entries and sorts by lastPlayedAt desc', () => {
    store.setLoading(true);
    const old = makeEntry({ episodeId: 'ep-old', lastPlayedAt: 10 });
    const recent = makeEntry({ episodeId: 'ep-recent', lastPlayedAt: 99 });

    store.setEntries([old, recent]);

    expect(store.entries()).toEqual([recent, old]);
    expect(store.isLoading()).toBe(false);
  });

  it('addOrUpdate adds new entries sorted by lastPlayedAt desc', () => {
    const older = makeEntry({ episodeId: 'ep-older', lastPlayedAt: 20 });
    const newer = makeEntry({ episodeId: 'ep-newer', lastPlayedAt: 50 });

    store.addOrUpdate(older);
    store.addOrUpdate(newer);

    expect(store.entries()).toEqual([newer, older]);
  });

  it('addOrUpdate replaces entry with same episodeId', () => {
    store.addOrUpdate(makeEntry({ episodeId: 'ep-1', position: 10, lastPlayedAt: 10 }));
    store.addOrUpdate(makeEntry({ episodeId: 'ep-1', position: 90, lastPlayedAt: 20 }));

    expect(store.entries()).toHaveLength(1);
    expect(store.entries()[0].position).toBe(90);
    expect(store.entries()[0].lastPlayedAt).toBe(20);
  });

  it('clear removes all entries and resets loading', () => {
    store.setLoading(true);
    store.addOrUpdate(makeEntry({ episodeId: 'ep-clear' }));

    store.clear();

    expect(store.entries()).toEqual([]);
    expect(store.isLoading()).toBe(false);
  });
});
