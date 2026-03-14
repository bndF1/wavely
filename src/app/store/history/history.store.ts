import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export type HistoryFilter = 'all' | 'unplayed' | 'inProgress' | 'completed';

export interface HistoryEntry {
  episodeId: string;
  episodeTitle: string;
  podcastTitle: string;
  imageUrl: string;
  position: number;
  duration: number;
  lastPlayedAt: number;
  completed: boolean;
}

export interface HistoryState {
  entries: HistoryEntry[];
  isLoading: boolean;
  filter: HistoryFilter;
}

const initialState: HistoryState = {
  entries: [],
  isLoading: false,
  filter: 'all',
};

const sortByLastPlayed = (entries: HistoryEntry[]): HistoryEntry[] =>
  [...entries].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);

export const HistoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    filteredEntries: computed(() => {
      const f = store.filter();
      const entries = store.entries();
      switch (f) {
        case 'unplayed':
          return entries.filter((e) => e.position === 0 && !e.completed);
        case 'inProgress':
          return entries.filter((e) => e.position > 0 && !e.completed);
        case 'completed':
          return entries.filter((e) => e.completed);
        default:
          return entries;
      }
    }),
    activeFilter: computed(() => store.filter()),
  })),
  withMethods((store) => ({
    setLoading(loading: boolean): void {
      patchState(store, { isLoading: loading });
    },
    setEntries(entries: HistoryEntry[]): void {
      patchState(store, { entries: sortByLastPlayed(entries), isLoading: false });
    },
    addOrUpdate(entry: HistoryEntry): void {
      const withoutCurrent = store.entries().filter((item) => item.episodeId !== entry.episodeId);
      patchState(store, {
        entries: sortByLastPlayed([...withoutCurrent, entry]),
      });
    },
    setFilter(filter: HistoryFilter): void {
      patchState(store, { filter });
    },
    markPlayed(episodeId: string): void {
      const updated = store.entries().map((e) =>
        e.episodeId === episodeId ? { ...e, completed: true, position: e.duration || e.position } : e
      );
      patchState(store, { entries: sortByLastPlayed(updated) });
    },
    markUnplayed(episodeId: string): void {
      const updated = store.entries().map((e) =>
        e.episodeId === episodeId ? { ...e, completed: false, position: 0 } : e
      );
      patchState(store, { entries: sortByLastPlayed(updated) });
    },
    clear(): void {
      patchState(store, { entries: [], isLoading: false });
    },
  }))
);
