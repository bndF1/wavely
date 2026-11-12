# Desktop Player

## Overview
Persistent player bar for desktop layouts (`wavely-desktop-player`). `TabsComponent` renders it whenever `PlayerStore.currentEpisode()` is set. It has seek, skip, volume and mute, playback-rate controls, and an inline Up Next queue list. Rendering is driven entirely by `PlayerStore` signals.

## Interface
- `DesktopPlayerComponent` (`desktop-player.component.ts`) - OnPush standalone component, selector `wavely-desktop-player`.
  - `store: PlayerStore` (public; the template binds to it directly).
  - Getters: `progressValue` (0..1), `currentTimeFormatted`, `remainingTimeFormatted` (prefixed with `-`). Times are formatted with `AudioService.formatTime`.
  - Methods: `togglePlay()`, `onSeek(event)` (range value 0..100 mapped to seconds), `onVolumeChange(event)`, `setRate(rate)`.
  - `playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]`.
- Template: `desktop-player.component.html`. It also calls `store.skipBack(15)`, `store.skipForward(30)`, `store.close()`, `store.toggleMute()`, `store.clearQueue()`, and `store.removeFromQueue(id)` directly.

## Invariants
- The template dereferences `store.currentEpisode()!`, so the parent must render this component only when an episode is loaded (`TabsComponent` does this).
- For live streams (`currentEpisode()?.isLive`), the progress, seek, skip and playback-rate controls are hidden and a "LIVE" badge is shown.
- `progressValue` returns 0 when `duration() <= 0`, which prevents division by zero.
- The component keeps no state of its own; every change goes through a `PlayerStore` method.

## Side Effects
- Playback state mutations through `PlayerStore`: `pause`, `resume`, `seek`, `setVolume`, `setPlaybackRate`, `skipBack`, `skipForward`, `close`, `toggleMute`, `clearQueue`, `removeFromQueue`. These in turn drive audio output.
- Registers ionicons for the player controls through `addIcons`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/player/desktop-player`
