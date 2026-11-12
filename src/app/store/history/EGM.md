# store/history

## Overview

`HistoryStore` is the in-memory NgRx signal store for listening history, with a
filter. `HistorySyncService` in
[`core/services`](../../core/services/EGM.md) persists history to Firestore,
and `AuthStore` loads it on sign-in.

## Interface

- Types (`history.store.ts`):
  - `HistoryFilter`: `'all' | 'unplayed' | 'inProgress' | 'completed'`.
  - `HistoryEntry`: `episodeId`, `episodeTitle`, `podcastTitle`, `imageUrl`,
    `position`, `duration`, `lastPlayedAt` (epoch ms), `completed`.
  - `HistoryState`: `entries`, `isLoading`, `filter`.
- `HistoryStore` (`signalStore({ providedIn: 'root' })`)
  - Computed:
    - `filteredEntries`: `unplayed` means `position === 0 && !completed`;
      `inProgress` means `position > 0 && !completed`; `completed` means `completed`.
    - `activeFilter`.
  - Methods: `setLoading`, `setEntries`, `addOrUpdate`, `setFilter`,
    `markPlayed`, `markUnplayed`, `clear`.

## Invariants

- `entries` are always sorted by `lastPlayedAt` descending (the internal
  `sortByLastPlayed`) after `setEntries`, `addOrUpdate`, `markPlayed`, and
  `markUnplayed`.
- There is at most one entry per `episodeId`: `addOrUpdate` replaces any
  existing entry.
- `setEntries` and `clear` reset `isLoading` to `false`. `clear` keeps the
  current `filter`.
- `markPlayed` sets `completed: true` and sets `position` to `duration`, keeping
  the existing `position` when `duration` is 0. `markUnplayed` sets
  `completed: false, position: 0`.

## Side Effects

- None (in-memory state only; it does not write to Firestore).

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/store/history`
