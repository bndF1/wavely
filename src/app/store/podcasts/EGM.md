# store/podcasts

## Overview

`PodcastsStore` is the NgRx signal store for podcast search results, trending
charts, and the user's subscriptions. Subscription mutations that need
persistence go through `SubscriptionSyncService` in
[`core/services`](../../core/services/EGM.md).

## Interface

- `PodcastsState` (`podcasts.store.ts`): `searchResults`, `subscriptions`,
  `trending` (all `Podcast[]`), `isLoading`, `error: string | null`, `searchQuery`.
- `PodcastsStore` (`signalStore({ providedIn: 'root' })`)
  - Search and trending methods: `setLoading(loading)`, `setQuery(query)`,
    `setSearchResults(results, query)`, `setError(error)`, `setTrending(podcasts)`.
  - Subscription methods: `addSubscription(podcast)`, `setSubscriptions(podcasts)`,
    `removeSubscription(podcastId)`.

## Invariants

- `addSubscription` does nothing if a podcast with the same `id` is already
  subscribed, so there are no duplicates.
- `setLoading` always clears `error`. `setSearchResults` and `setError` set
  `isLoading: false`. `setTrending` and `setQuery` leave `isLoading` unchanged,
  so callers must reset it.
- Calling the subscription methods directly changes memory only. To persist to
  Firestore with rollback, use `SubscriptionSyncService`.

## Side Effects

- None (in-memory state only).

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/store/podcasts`
