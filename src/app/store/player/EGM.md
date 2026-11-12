# store/player

## Overview

`PlayerStore` is the NgRx signal store and the source of truth for playback
intent: the current episode, play state, position, rate, volume, and the Up Next
queue. `AudioService` in [`core/services`](../../core/services/EGM.md) reacts to
these signals to drive the real `HTMLAudioElement`, and writes progress back
through `updateProgress`.

## Interface

- `PlayerState` (`player.store.ts`): `currentEpisode: Episode | null`,
  `isPlaying`, `currentTime`, `duration`, `playbackRate`, `queue: Episode[]`,
  `isMinimised`, `volume`, `isMuted`. Defaults: `playbackRate: 1`,
  `isMinimised: true`, `volume: 1`, `isMuted: false`.
- `PlayerStore` (`signalStore({ providedIn: 'root' })`)
  - Computed: `effectiveVolume`, which is `0` when muted and `volume` otherwise.
  - Playback methods: `play(episode)`, `pause()`, `resume()`, `seek(time)`,
    `setDuration`, `setPlaybackRate`, `updateProgress(currentTime, duration)`,
    `skipBack(seconds = 15)`, `skipForward(seconds = 30)`.
  - Queue methods: `addToQueue`, `queueNext` (inserts at the front),
    `removeFromQueue(episodeId)`, `clearQueue`, `playNext()`.
  - UI and audio methods: `toggleMinimise`, `close()`, `setVolume(volume)`, `toggleMute`.

## Invariants

- **Seeking:** changing `currentTime` by more than 1s through `seek`,
  `skipBack`, or `skipForward` is treated as a seek by `AudioService`.
  `updateProgress` is the non-seeking path that the audio element uses.
- **Skip bounds:** `skipBack` clamps at 0, and `skipForward` clamps at `duration`.
  When `duration` is 0 (live streams, or before metadata loads), `skipForward`
  seeks to 0. `seek`, `setDuration` and `setPlaybackRate` do no validation.
- **`playNext()`:**
  - If the queue has an item, it removes the first one, makes it current, and
    keeps `isPlaying: true`.
  - If the queue is empty, it sets `isPlaying: false, currentTime: 0` and keeps
    `currentEpisode`. Through `AudioService`'s seek effect, this rewinds the
    element to 0.
- **`close()`** resets `currentEpisode`, `isPlaying`, `currentTime`,
  `duration`, and `queue`. It leaves `playbackRate`, `volume`, `isMuted` and
  `isMinimised` unchanged. `AuthStore` calls it on user switch and sign-out.
- **`setVolume`:**
  - Clamps the value to `[0, 1]` and ignores non-finite values.
  - Also unmutes.
- `play(episode)` resets `currentTime` to 0. The saved position is restored
  separately by `AudioService`.

## Side Effects

- None directly (in-memory state). Side effects come from the effects in
  `AudioService` that react to this store.

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/store/player`
