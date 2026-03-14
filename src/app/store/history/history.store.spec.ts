import { TestBed } from '@angular/core/testing';
import { HistoryStore, type HistoryEntry, type HistoryFilter } from './history.store';

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

  it('has initial activeFilter of "all"', () => {
    expect(store.activeFilter()).toBe('all');
  });

  it('setFilter updates activeFilter', () => {
    store.setFilter('completed');
    expect(store.activeFilter()).toBe('completed');

    store.setFilter('all');
    expect(store.activeFilter()).toBe('all');
  });

  describe('filteredEntries', () => {
    const unplayed = makeEntry({ episodeId: 'ep-unplayed', position: 0, completed: false });
    const inProgress = makeEntry({ episodeId: 'ep-progress', position: 45, completed: false });
    const completed = makeEntry({ episodeId: 'ep-done', position: 120, completed: true });

    beforeEach(() => {
      store.setEntries([unplayed, inProgress, completed]);
    });

    it('"all" returns every entry', () => {
      store.setFilter('all');
      expect(store.filteredEntries()).toHaveLength(3);
    });

    it('"unplayed" returns entries with position 0 and not completed', () => {
      store.setFilter('unplayed');
      const result = store.filteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].episodeId).toBe('ep-unplayed');
    });

    it('"inProgress" returns entries with position > 0 and not completed', () => {
      store.setFilter('inProgress');
      const result = store.filteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].episodeId).toBe('ep-progress');
    });

    it('"completed" returns entries where completed is true', () => {
      store.setFilter('completed');
      const result = store.filteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].episodeId).toBe('ep-done');
    });
  });

  it('markPlayed sets completed true on the matching entry', () => {
    store.setEntries([
      makeEntry({ episodeId: 'ep-1', completed: false, position: 30 }),
      makeEntry({ episodeId: 'ep-2', completed: false, position: 0 }),
    ]);

    store.markPlayed('ep-1');

    const ep1 = store.entries().find((e) => e.episodeId === 'ep-1')!;
    const ep2 = store.entries().find((e) => e.episodeId === 'ep-2')!;
    expect(ep1.completed).toBe(true);
    expect(ep2.completed).toBe(false);
  });

  it('markUnplayed sets completed false and position 0 on the matching entry', () => {
    store.setEntries([
      makeEntry({ episodeId: 'ep-1', completed: true, position: 120 }),
      makeEntry({ episodeId: 'ep-2', completed: true, position: 60 }),
    ]);

    store.markUnplayed('ep-1');

    const ep1 = store.entries().find((e) => e.episodeId === 'ep-1')!;
    const ep2 = store.entries().find((e) => e.episodeId === 'ep-2')!;
    expect(ep1.completed).toBe(false);
    expect(ep1.position).toBe(0);
    expect(ep2.completed).toBe(true);
  });
});
