# shared

## Overview
Shared UI layer of the Wavely app. It holds the standalone presentational components that feature pages reuse, plus a small barrel file. The components depend on `src/app/core` models (`Episode`, `Podcast`) and on `NetworkService` (used only by `offline-banner`). `episode-item` and `offline-banner` also use `@ngx-translate/core` `TranslatePipe`. Nothing in this directory depends on feature modules.

## Interface
- `index.ts` (barrel) re-exports only:
  - `ErrorStateComponent` from `./components/error-state/error-state.component`
  - `EmptyStateComponent` from `./components/empty-state/empty-state.component`
- `EpisodeItemComponent`, `OfflineBannerComponent`, and `PodcastCardComponent` are not in the barrel. Import them by their file paths.
- Subdirectories:
  - [components](./components/EGM.md) - index of all shared UI components.

## Invariants
- All components are standalone (no NgModules) and use signal `input()` / `output()` APIs.
- Components do not make network or storage calls. Parents handle actions such as play, queue, retry, and click through outputs.
- Selector prefix is `wavely-`, except `ErrorStateComponent`, which uses `app-error-state`.
- Image fallbacks (`episode-item`, `podcast-card`) use `/default-artwork.svg`.

## Side Effects
- Ionicons are registered globally with `addIcons` in the constructors of `EpisodeItemComponent`, `ErrorStateComponent`, and `OfflineBannerComponent`.
- `OfflineBannerComponent` subscribes to the `NetworkService.isOnline` signal through an `effect`.
- `EpisodeItemComponent.emitQueue` starts a 2 s `setTimeout` on each add-to-queue click. `ngOnDestroy` clears it.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/shared`
