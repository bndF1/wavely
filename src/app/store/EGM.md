# store

## Overview

Root-provided NgRx signal stores (`@ngrx/signals` `signalStore`) that hold the
app's reactive in-memory state. Most stores are plain state holders. The
exceptions are:

- `AuthStore`, which coordinates per-user load and teardown.
- `LayoutStore`, which persists sidebar state to localStorage.

Firestore persistence and audio side effects live in
[`core/services`](../core/services/EGM.md).

## Subdirectories & Boundaries

- auth: [./auth/EGM.md](./auth/EGM.md) - `AuthStore` (user, loading, error;
  `init`, `signInWithGoogle`, `signOut`).
  - On sign-in or user switch, it clears the player, subscriptions, history and
    (on a switch) radio favorites. It then loads subscriptions, favorites and
    history from Firestore with stale-user guards.
  - On sign-out, it clears all per-user state.
- history: [./history/EGM.md](./history/EGM.md) - `HistoryStore`, `HistoryEntry`, `HistoryFilter`.
  Entries stay sorted by `lastPlayedAt` descending, with one per `episodeId`.
- layout: [./layout/EGM.md](./layout/EGM.md) - `LayoutStore` (`sidebarCollapsed`,
  `queueFocused`, `sidebarWidth`). The sidebar state persists to the
  localStorage key `wavely-sidebar-collapsed`.
- player: [./player/EGM.md](./player/EGM.md) - `PlayerStore`, the source of
  truth for playback intent and the Up Next queue. `AudioService` mirrors it to
  the `HTMLAudioElement`.
- podcasts: [./podcasts/EGM.md](./podcasts/EGM.md) - `PodcastsStore` (search
  results, trending, subscriptions). Persist subscriptions through
  `SubscriptionSyncService`.
