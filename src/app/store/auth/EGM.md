# store/auth

## Overview

`AuthStore` is the NgRx signal store that mirrors the Firebase auth user. It
coordinates per-user state loading and teardown across the other stores and the
Firestore sync services when users sign in, switch accounts, or sign out.

## Interface

- `AuthStore` (`auth.store.ts`, `signalStore({ providedIn: 'root' })`)
  - State: `user: User | null` (`firebase/auth`), `loading: boolean`, `error: string | null`.
  - Computed: `isAuthenticated`, `displayName`, `photoURL`, `email`.
  - `init()`: an `rxMethod<void>` that subscribes to `AuthService.user$` and
    handles each auth transition. Call it only once (`App` does). Each call adds
    another `user$` subscription.
  - `signInWithGoogle(): Promise<void>`: sets `loading: true, error: null`, then
    delegates to `AuthService`. On success, `loading` stays true until the next
    `user$` emission. On error it sets `error` to the `Error` message, or to
    `'Sign-in failed'` when the thrown value is not an `Error`.
  - `signOut(): Promise<void>`: delegates to `AuthService.signOut()` only.
- Dependencies:
  - [`core/auth`](../../core/auth/EGM.md) `AuthService`
  - [`core/services`](../../core/services/EGM.md) `SubscriptionSyncService`,
    `HistorySyncService`, `RadioFavoritesSyncService`
  - `HistoryStore`, `PlayerStore`

## Invariants

- **On sign-in or user switch** (a new `uid` that differs from the previous one):
  1. Call `playerStore.close()`.
  2. Call `syncService.clearSubscriptions()`.
  3. Call `historyStore.clear()`, then `historyStore.setLoading(true)`.
  4. Call `radioFavoritesSync.clearFavorites()`, but only when the previous
     `uid` was not null. On the first sign-in, local favorites are kept so they
     can be merged into Firestore.
  5. Load subscriptions, favorites, and history from Firestore. Each load
     carries a stale-result guard: `store.user()?.uid === user.uid`.
- **History merge:** history loaded from Firestore is merged by `episodeId`.
  The entry with the newer `lastPlayedAt` wins, and ties go to the remote entry.
- **On sign-out** (`!user && previousUid`), it clears:
  - player state
  - subscriptions
  - history
  - radio favorites
- **`signOut()` must not patch `user` to null itself.** The `user$` subscriber
  needs `previousUid` to detect sign-out and run the clears.

## Side Effects

- Triggers Firestore reads through the sync services under `users/{uid}/`:
  - `subscriptions`
  - `favoriteStations`
  - `history`
- Mutates `PlayerStore`, `HistoryStore`, `PodcastsStore` (through
  `SubscriptionSyncService`), and `UserPreferencesService` (through
  `RadioFavoritesSyncService`).
- Starts a long-lived subscription to `AuthService.user$` inside `init()`. It is
  never unsubscribed.
- `signInWithGoogle` opens a Google auth popup.

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/store/auth`
