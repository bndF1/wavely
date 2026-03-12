import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Episode } from '../../core/models/podcast.model';

export interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  queue: Episode[];
  isMinimised: boolean;
}

const initialState: PlayerState = {
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  queue: [],
  isMinimised: true,
};

export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    play(episode: Episode): void {
      patchState(store, { currentEpisode: episode, isPlaying: true, currentTime: 0 });
    },
    pause(): void {
      patchState(store, { isPlaying: false });
    },
    resume(): void {
      patchState(store, { isPlaying: true });
    },
    seek(time: number): void {
      patchState(store, { currentTime: time });
    },
    setDuration(duration: number): void {
      patchState(store, { duration });
    },
    setPlaybackRate(rate: number): void {
      patchState(store, { playbackRate: rate });
    },
    toggleMinimise(): void {
      patchState(store, { isMinimised: !store.isMinimised() });
    },
    addToQueue(episode: Episode): void {
      patchState(store, { queue: [...store.queue(), episode] });
    },
    clearQueue(): void {
      patchState(store, { queue: [] });
    },
  }))
);
