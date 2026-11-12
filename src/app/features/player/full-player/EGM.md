# Full Player

## Overview
Full-screen "Now Playing" modal (`wavely-full-player`) for mobile and tablet layouts. `PlayerModalService.open()` lazy-imports and presents it; the service skips it on desktop (width 1024 px or more). It shows artwork, a scrubber, transport controls, a playback-speed picker, and the Up Next queue.

## Interface
- `FullPlayerComponent` (`full-player.component.ts`) - standalone component (default change detection), selector `wavely-full-player`.
  - `store: PlayerStore` (public).
  - `rates = [0.5, 0.75, 1, 1.25, 1.5, 2]`.
  - Getters: `isLive`, `progressValue`, `currentTimeLabel`, `remainingTimeLabel`, `rateLabel` (for example `1×`).
  - Methods: `dismiss()`, `togglePlay()`, `onScrubChange(event)` (an `ion-range` value of 0..100 mapped to seconds), `skipBack()` (15 s), `skipForward()` (30 s), `showSpeedPicker()`.
- Template: `full-player.component.html`. It also calls `store.clearQueue()` and `store.removeFromQueue(id)` directly.

## Invariants
- `isLive` is true only when `currentEpisode()?.isLive === true`. Live streams hide the scrubber, time labels, skip buttons, and speed control.
- Skip intervals are fixed: back 15 s, forward 30 s.
- The template body renders only inside `@if (store.currentEpisode())`. The `ion-header` (close and speed buttons) renders outside that guard.
- Because the component is lazy-loaded by `src/app/core/services/player-modal.service.ts`, that service's dynamic import path must stay in sync with this file's location.

## Side Effects
- UI: `ModalController.dismiss()` closes the modal. `ActionSheetController.create(...)` presents the speed picker, which marks the current rate with a check.
- Playback state mutations through `PlayerStore`: `pause`, `resume`, `seek`, `skipBack`, `skipForward`, `setPlaybackRate`, `clearQueue`, `removeFromQueue`.
- Registers ionicons through `addIcons`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/player/full-player`
