import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

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
}

const initialState: HistoryState = {
  entries: [],
  isLoading: false,
};

const sortByLastPlayed = (entries: HistoryEntry[]): HistoryEntry[] =>
  [...entries].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);

export const HistoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
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
    clear(): void {
      patchState(store, { entries: [], isLoading: false });
    },
  }))
);
