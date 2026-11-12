# Podcast Detail Feature

## Overview
Routed page (`wavely-podcast-detail`) for one podcast at `/podcast/:id`. It shows podcast metadata, a subscribe/unsubscribe toggle, a link to the publisher, and an infinitely scrolling episode list with play and queue actions.

## Interface
- `PodcastDetailPage` (`podcast-detail.page.ts`) - OnPush standalone component, selector `wavely-podcast-detail`.
  - State (plain fields; change detection runs through `ChangeDetectorRef`): `podcast`, `episodes` (visible slice), `isLoading`, `episodesError`, `podcastError`, `hasMoreEpisodes`. Private `allEpisodes` holds every fetched episode.
  - Exposed stores: `podcastsStore: PodcastsStore`, `playerStore: PlayerStore`.
  - Template-facing methods: `goBack()`, `loadMoreEpisodes(event)`, `retryLoad()`, getter `isSubscribed`, `toggleSubscription()`, `playEpisode(episode)`, `queueEpisode(episode)`, `onImageError(event)`, `navigateToPublisher()`.
  - Private static `PAGE_SIZE = 15`.
- Template: `podcast-detail.page.html`.

## Invariants
- Loading is driven by `route.paramMap` through `switchMap`, so a reused component with a new `:id` cancels the earlier load and resets state (`resetState()`).
- Load order:
  1. `lookupPodcast(id, country)`, retried twice with a 1 s delay.
  2. If the podcast has a `feedUrl`, the RSS feed (`getEpisodesFromRss`).
  3. iTunes `getPodcastEpisodes(id, 200, country)` (retried twice with a 1 s delay) when there is no feed or RSS returns zero episodes.
- A metadata failure sets `podcastError` and continues with `podcast = null`. Because the content block requires `podcast`, any episodes fetched afterwards are not shown.
- `retryLoad()` subscribes outside the `switchMap` pipeline, so it can race an in-flight param load.
- An iTunes episode failure sets `episodesError` and yields `[]`.
- Because fields are not signals, every state mutation must be followed by `cdr.markForCheck()` (or `detectChanges()`).
- `toggleSubscription` calls `cdr.detectChanges()` synchronously so the optimistic "Subscribed" state appears before the Firestore write resolves.
- `playEpisode` and `queueEpisode` do nothing when `podcast` is null, and stamp `podcastTitle` onto each episode. `playEpisode` clears the queue. When `autoQueueEnabled()` is true, it queues the following episodes from `allEpisodes`, including ones not yet revealed by infinite scroll.
- `goBack()` uses `Location.back()` when `window.history.length > 1`; otherwise it navigates to `/tabs/home`.
- `navigateToPublisher` navigates only when `podcast.artistId` is set.

## Side Effects
- Network: `PodcastApiService.lookupPodcast`, `getEpisodesFromRss`, `getPodcastEpisodes`.
- Firestore and store through `SubscriptionSyncService.addSubscription(podcast, uid | null)` and `removeSubscription(id, uid | null)`. The uid comes from `AuthStore.user()`.
- Player: `PlayerStore.clearQueue`, `addToQueue`, `play`; then `PlayerModalService.open()`.
- Navigation: `Location.back()`, `/tabs/home`, `/publisher/:artistId`.
- DOM: a broken artwork image falls back to `/default-artwork.svg`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/podcast-detail`
