import { TestBed } from '@angular/core/testing';
import { PodcastsStore } from './podcasts.store';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('PodcastsStore', () => {
  let store: InstanceType<typeof PodcastsStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PodcastsStore] });
    store = TestBed.inject(PodcastsStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('initial state', () => {
    it('has correct defaults', () => {
      expect(store.searchResults()).toEqual([]);
      expect(store.subscriptions()).toEqual([]);
      expect(store.trending()).toEqual([]);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.searchQuery()).toBe('');
    });
  });

  describe('setLoading()', () => {
    it('sets isLoading to true and clears error', () => {
      store.setError('previous error');
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
      expect(store.error()).toBeNull();
    });

    it('sets isLoading to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('setQuery()', () => {
    it('updates searchQuery', () => {
      store.setQuery('angular podcasts');
      expect(store.searchQuery()).toBe('angular podcasts');
    });
  });

  describe('setSearchResults()', () => {
    it('sets results and query, clears loading', () => {
      store.setLoading(true);
      const results = [mockPodcast(), mockPodcast()];
      store.setSearchResults(results, 'angular');
      expect(store.searchResults()).toEqual(results);
      expect(store.searchQuery()).toBe('angular');
      expect(store.isLoading()).toBe(false);
    });

    it('accepts empty results', () => {
      store.setSearchResults([], '');
      expect(store.searchResults()).toEqual([]);
    });
  });

  describe('setError()', () => {
    it('sets error message and clears loading', () => {
      store.setLoading(true);
      store.setError('Network error');
      expect(store.error()).toBe('Network error');
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('setTrending()', () => {
    it('replaces trending list', () => {
      const podcasts = [mockPodcast(), mockPodcast(), mockPodcast()];
      store.setTrending(podcasts);
      expect(store.trending()).toEqual(podcasts);
      expect(store.trending()).toHaveLength(3);
    });
  });

  describe('addSubscription()', () => {
    it('adds a podcast to subscriptions', () => {
      const podcast = mockPodcast();
      store.addSubscription(podcast);
      expect(store.subscriptions()).toContainEqual(podcast);
      expect(store.subscriptions()).toHaveLength(1);
    });

    it('does NOT add duplicate subscriptions', () => {
      const podcast = mockPodcast();
      store.addSubscription(podcast);
      store.addSubscription(podcast);
      expect(store.subscriptions()).toHaveLength(1);
    });

    it('can add multiple distinct podcasts', () => {
      store.addSubscription(mockPodcast());
      store.addSubscription(mockPodcast());
      expect(store.subscriptions()).toHaveLength(2);
    });
  });

  describe('setSubscriptions()', () => {
    it('replaces all subscriptions', () => {
      store.addSubscription(mockPodcast());
      const newList = [mockPodcast(), mockPodcast()];
      store.setSubscriptions(newList);
      expect(store.subscriptions()).toEqual(newList);
    });

    it('can clear all subscriptions by setting empty array', () => {
      store.addSubscription(mockPodcast());
      store.setSubscriptions([]);
      expect(store.subscriptions()).toEqual([]);
    });
  });

  describe('removeSubscription()', () => {
    it('removes the podcast with matching id', () => {
      const podcast = mockPodcast({ id: 'pod-abc' });
      store.addSubscription(podcast);
      store.removeSubscription('pod-abc');
      expect(store.subscriptions()).toEqual([]);
    });

    it('leaves other subscriptions intact', () => {
      const pod1 = mockPodcast({ id: 'pod-1' });
      const pod2 = mockPodcast({ id: 'pod-2' });
      store.addSubscription(pod1);
      store.addSubscription(pod2);
      store.removeSubscription('pod-1');
      expect(store.subscriptions()).toHaveLength(1);
      expect(store.subscriptions()[0]).toEqual(pod2);
    });

    it('is a no-op when podcast not in subscriptions', () => {
      store.addSubscription(mockPodcast({ id: 'pod-1' }));
      store.removeSubscription('pod-not-exist');
      expect(store.subscriptions()).toHaveLength(1);
    });
  });
});
