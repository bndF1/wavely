import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Podcast } from '../../core/models/podcast.model';

export interface PodcastsState {
  searchResults: Podcast[];
  subscriptions: Podcast[];
  trending: Podcast[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: PodcastsState = {
  searchResults: [],
  subscriptions: [],
  trending: [],
  isLoading: false,
  error: null,
  searchQuery: '',
};

export const PodcastsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setLoading(loading: boolean): void {
      patchState(store, { isLoading: loading, error: null });
    },
    setSearchResults(results: Podcast[], query: string): void {
      patchState(store, { searchResults: results, searchQuery: query, isLoading: false });
    },
    setError(error: string): void {
      patchState(store, { error, isLoading: false });
    },
    setTrending(podcasts: Podcast[]): void {
      patchState(store, { trending: podcasts });
    },
    addSubscription(podcast: Podcast): void {
      const already = store.subscriptions().some((p) => p.id === podcast.id);
      if (!already) {
        patchState(store, { subscriptions: [...store.subscriptions(), podcast] });
      }
    },
    removeSubscription(podcastId: string): void {
      patchState(store, {
        subscriptions: store.subscriptions().filter((p) => p.id !== podcastId),
      });
    },
  }))
);
