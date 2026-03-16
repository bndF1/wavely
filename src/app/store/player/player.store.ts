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
    /** Insert episode at position 0 — plays immediately after current */
    queueNext(episode: Episode): void {
      patchState(store, { queue: [episode, ...store.queue()] });
    },
    clearQueue(): void {
      patchState(store, { queue: [] });
    },
    /** Called by AudioService on every timeupdate — does NOT trigger a seek */
    updateProgress(currentTime: number, duration: number): void {
      patchState(store, { currentTime, duration });
    },
    skipBack(seconds = 15): void {
      const newTime = Math.max(0, store.currentTime() - seconds);
      patchState(store, { currentTime: newTime });
    },
    skipForward(seconds = 30): void {
      const newTime = Math.min(store.duration(), store.currentTime() + seconds);
      patchState(store, { currentTime: newTime });
    },
    removeFromQueue(episodeId: string): void {
      patchState(store, { queue: store.queue().filter((e) => e.id !== episodeId) });
    },
    /** Advance to next episode in queue, or stop if queue is empty */
    playNext(): void {
      const [next, ...rest] = store.queue();
      if (next) {
        patchState(store, { currentEpisode: next, isPlaying: true, currentTime: 0, queue: rest });
      } else {
        patchState(store, { isPlaying: false, currentTime: 0 });
      }
    },
    /** Dismiss player entirely — does NOT clear the queue (call clearQueue() separately for logout/user-switch) */
    close(): void {
      patchState(store, { currentEpisode: null, isPlaying: false, currentTime: 0, duration: 0 });
    },
  }))
);
