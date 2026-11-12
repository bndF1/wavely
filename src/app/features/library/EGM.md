# Library Feature

## Overview
Library tab page (`wavely-library`). It shows the signed-in user's subscriptions and listening history (with filters and played/unplayed toggles), and has entry points to Settings and sign-out. Changes are synced to Firestore through the sync services when a user is signed in.

## Interface
- `LibraryPage` (`library.page.ts`) - OnPush standalone component, selector `wavely-library`.
  - Exposed: `store: PodcastsStore`, `authStore: AuthStore`, `historyStore: HistoryStore`, `appVersion` (from `environment.appVersion`), `historyFilters` (`all`, `unplayed`, `inProgress`, `completed`, labeled with i18n keys).
  - Signals and computed: `showAllHistory`, `recentHistory`, `hiddenCount`.
  - Template-facing methods: `selectFilter(filter)`, `markPlayed(episodeId)`, `markUnplayed(episodeId)`, `navigateToPodcast(podcast)`, `navigateToBrowse()`, `unsubscribe(podcast, slidingItem)`, `clearHistory()`, `toggleShowAll()`, `navigateToSettings()`, `signOut()`, `onImageError(event)`.
  - Pure helpers: `progressValue(entry)` (clamped to 0..1), `formatTime(seconds)` (`m:ss` or `h:mm:ss`), `formatRelativeTime(ts)`.
  - Private constant `HISTORY_LIMIT = 10`.
- Template: `library.page.html`.

## Invariants
- History is loaded once in the constructor. With no signed-in user (`authStore.user()?.uid` falsy), the page calls `historyStore.clear()` and never loads.
- Under the `all` filter, while `showAllHistory` is false, `recentHistory` shows only incomplete entries, at most `HISTORY_LIMIT`; `hiddenCount` reports the rest. Other filters show every `filteredEntries()`.
- `selectFilter` always resets `showAllHistory` to false.
- `markPlayed` and `markUnplayed` update `HistoryStore` optimistically first, and write to Firestore only when a uid exists. `markUnplayed` also resets `position: 0`.
- `signOut` awaits `authStore.signOut()` before navigating to `/login`.

## Side Effects
- Firestore through `HistorySyncService`: `loadHistory(uid)`, `updateEntry(episodeId, patch, uid)`, `clearHistory(uid ?? '')`.
- Firestore through `SubscriptionSyncService.removeSubscription(podcastId, uid | null)`.
- Store mutations: `HistoryStore.clear`, `setLoading`, `setEntries`, `setFilter`, `markPlayed`, `markUnplayed`.
- Auth: `AuthStore.signOut()`.
- Navigation: `/podcast/:id`, `/tabs/discover`, `/settings`, `/login`.
- DOM: `onImageError` replaces a broken image `src` with `/default-artwork.svg`.
- Logs `console.error` when loading history fails.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/library`
