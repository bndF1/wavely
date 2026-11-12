# Tabs Shell

## Overview
Main authenticated layout shell (`wavely-tabs`). It renders the `ion-tabs` bottom bar (home, discover, radio, library), a collapsible desktop sidebar with the same destinations plus Settings, the offline banner, and the player surfaces (`MiniPlayerComponent` docked in the tabs, `DesktopPlayerComponent` in a sibling `<aside class="desktop-player-rail">`) whenever an episode is loaded.

## Interface
- `TabsComponent` (`tabs.component.ts`) - OnPush standalone component, selector `wavely-tabs`.
  - Public: `store: PlayerStore`, `layoutStore: LayoutStore`.
  - `openFullPlayer(): Promise<void>` - bound to the mini player's `(openFull)` output.
- Template: `tabs.component.html`. Links go to `/tabs/home`, `/tabs/discover`, `/tabs/radio`, `/tabs/library`, and `/settings`; the sidebar toggle calls `layoutStore.toggleSidebar()`.
- Composes `MiniPlayerComponent` and `DesktopPlayerComponent` (see the [Player contracts](../player/EGM.md)) and `OfflineBannerComponent` from `src/app/shared/components/offline-banner`.

## Invariants
- The player components render only when `store.currentEpisode()` is truthy; `ion-tabs` gets the `has-mini-player` class in that case.
- `openFullPlayer()` does nothing when there is no current episode id. Otherwise it delegates to `PlayerModalService.open()`, which is itself a no-op on desktop.
- The constructor calls `layoutStore.initFromStorage()`, so sidebar state is restored once per shell instantiation.

## Side Effects
- Reads persisted layout state through `LayoutStore.initFromStorage()` and mutates it through `toggleSidebar()`.
- Opens the full-player modal through `PlayerModalService.open()`.
- Registers tab and sidebar ionicons through `addIcons`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/tabs`
