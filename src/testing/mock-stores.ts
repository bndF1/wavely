import { signal } from '@angular/core';
import type { PlayerState } from '../app/store/player/player.store';
import type { PodcastsState } from '../app/store/podcasts/podcasts.store';
import type { Podcast } from '../app/core/models/podcast.model';

export function mockPlayerStore(overrides: Partial<PlayerState> = {}) {
  const state: PlayerState = {
    currentEpisode: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    queue: [],
    isMinimised: true,
    ...overrides,
  };

  return {
    currentEpisode: signal(state.currentEpisode),
    isPlaying: signal(state.isPlaying),
    currentTime: signal(state.currentTime),
    duration: signal(state.duration),
    playbackRate: signal(state.playbackRate),
    queue: signal(state.queue),
    isMinimised: signal(state.isMinimised),
    play: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    seek: jest.fn(),
    setDuration: jest.fn(),
    setPlaybackRate: jest.fn(),
    toggleMinimise: jest.fn(),
    addToQueue: jest.fn(),
    clearQueue: jest.fn(),
    removeFromQueue: jest.fn(),
    updateProgress: jest.fn(),
    skipBack: jest.fn(),
    skipForward: jest.fn(),
    playNext: jest.fn(),
    close: jest.fn(),
  };
}

export function mockPodcastsStore(overrides: Partial<PodcastsState> = {}) {
  const state: PodcastsState = {
    searchResults: [],
    subscriptions: [],
    trending: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    ...overrides,
  };

  return {
    searchResults: signal<Podcast[]>(state.searchResults),
    subscriptions: signal<Podcast[]>(state.subscriptions),
    trending: signal<Podcast[]>(state.trending),
    isLoading: signal(state.isLoading),
    error: signal<string | null>(state.error),
    searchQuery: signal(state.searchQuery),
    setLoading: jest.fn(),
    setQuery: jest.fn(),
    setSearchResults: jest.fn(),
    setError: jest.fn(),
    setTrending: jest.fn(),
    addSubscription: jest.fn(),
    setSubscriptions: jest.fn(),
    removeSubscription: jest.fn(),
  };
}

export function mockAuthStore(overrides: { uid?: string; displayName?: string } = {}) {
  const mockUser = overrides.uid
    ? {
        uid: overrides.uid,
        displayName: overrides.displayName ?? 'Test User',
        email: 'test@test.com',
        photoURL: null as string | null,
      }
    : null;

  return {
    user: signal(mockUser),
    isAuthenticated: signal(mockUser !== null),
    displayName: signal(mockUser?.displayName ?? null),
    photoURL: signal(mockUser?.photoURL ?? null),
    email: signal(mockUser?.email ?? null),
    loading: signal(false),
    error: signal<string | null>(null),
    init: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  };
}

export type MockPlayerStore = ReturnType<typeof mockPlayerStore>;
export type MockPodcastsStore = ReturnType<typeof mockPodcastsStore>;
export type MockAuthStore = ReturnType<typeof mockAuthStore>;
