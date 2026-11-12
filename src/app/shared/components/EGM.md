# components

## Overview
Groups Wavely's reusable standalone Angular/Ionic UI components. Each component sits in its own folder. All of them are signal-based (`input()`/`output()`) and leave business logic to their parents. The one exception is `offline-banner`, which reads `NetworkService`.

## Subdirectories & Boundaries
- empty-state: [./empty-state/EGM.md](./empty-state/EGM.md) - `EmptyStateComponent` (`wavely-empty-state`). Empty-list placeholder with an optional `action` output. Exported from the shared barrel.
- episode-item: [./episode-item/EGM.md](./episode-item/EGM.md) - `EpisodeItemComponent` (`wavely-episode-item`). Episode row that emits `episodePlay` and `addToQueue`, with a 2 s "just added" indicator.
- error-state: [./error-state/EGM.md](./error-state/EGM.md) - `ErrorStateComponent` (`app-error-state`). Error placeholder with a `retry` output. Exported from the shared barrel.
- offline-banner: [./offline-banner/EGM.md](./offline-banner/EGM.md) - `OfflineBannerComponent` (`wavely-offline-banner`). Dismissible banner driven by `NetworkService.isOnline()`.
- podcast-card: [./podcast-card/EGM.md](./podcast-card/EGM.md) - `PodcastCardComponent` (`wavely-podcast-card`). Podcast card that emits `cardClick` and has a skeleton `loading` state.
