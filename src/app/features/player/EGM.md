# Player

## Overview
Groups the three presentation components of the audio player. All three are thin views over the global `PlayerStore` (`src/app/store/player/player.store.ts`) and hold no playback state of their own. This directory contains no source files directly.

## Subdirectories & Boundaries
- Desktop Player: [./desktop-player/EGM.md](./desktop-player/EGM.md) - `DesktopPlayerComponent`, the persistent desktop bar with seek, volume and mute, rate buttons, and the queue. Rendered by `TabsComponent` in a separate `<aside class="desktop-player-rail">` beside `ion-tabs`.
- Full Player: [./full-player/EGM.md](./full-player/EGM.md) - `FullPlayerComponent`, the mobile "Now Playing" modal. Lazy-loaded by `PlayerModalService.open()` and skipped on desktop.
- Mini Player: [./mini-player/EGM.md](./mini-player/EGM.md) - `MiniPlayerComponent`, the docked compact bar. Emits `openFull` to request the full player (non-desktop only).
