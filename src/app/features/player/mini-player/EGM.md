# Mini Player

## Overview
Compact player bar (`wavely-mini-player`) that `TabsComponent` docks in the `ion-tabs` bottom slot while an episode is loaded. Tapping its body asks the parent to open the full player; the request is suppressed on desktop.

## Interface
- `MiniPlayerComponent` (`mini-player.component.ts`) - standalone component, selector `wavely-mini-player`.
  - `store: PlayerStore` (public).
  - Output: `openFull = output<void>()`.
  - Getters: `progressValue` (0..1), `isDesktop` (delegates to `PlayerModalService.isDesktop`).
  - Methods: `handleBodyClick(event?)`, `skipBack(event)` (15 s), `skipForward(event)` (30 s), `togglePlay(event)`, `close(event)`.
- Template: `mini-player.component.html`.

## Invariants
- `openFull` is emitted only when `!isDesktop`. Enter and Space keydown also trigger the body click (with `preventDefault` for keyboard events) on non-desktop layouts.
- Every control button calls `event.stopPropagation()` so it does not also trigger the body click and open the full player.
- Skip buttons and progress are hidden for live episodes (`currentEpisode()?.isLive`).
- The template renders only inside `@if (store.currentEpisode())`.

## Side Effects
- Playback state mutations through `PlayerStore`: `skipBack`, `skipForward`, `pause`, `resume`, `close`.
- Emits `openFull` to the parent (`TabsComponent.openFullPlayer()`).
- Registers ionicons through `addIcons`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/player/mini-player`
