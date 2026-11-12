# Home Feature

## Overview
Home tab page (`wavely-home`). It shows the user's favorite radio stations, a "My podcasts" row, and a "new episodes" feed merged from all subscribed podcasts, newest first. Trending podcasts render only when the user has no subscriptions. The feed reloads automatically when the subscription set changes and every time the view is entered.

## Interface
- `HomePage` (`home.page.ts`) - standalone component, selector `wavely-home`; implements `OnInit`, plus the Ionic lifecycle hook `ionViewWillEnter()`.
  - Exposed: `store: PodcastsStore`, `prefs: UserPreferencesService`, `skeletonPodcast`.
  - Feed signals: `isFeedLoading`, `feedError`; computed `feedEpisodes`, `hasMoreFeed`, `hiddenFeedCount`.
  - Template-facing methods: `handleRefresh(event)`, `retryTrending()`, `retryFeed()`, `loadMoreFeed()`, `navigateToPodcast(podcast)`, `navigateToSearch()`, `navigateToBrowse()`, `playEpisode(episode)`, `queueEpisode(episode)`, `playStation(station)`.
  - Private loaders: `loadTrending()`, `loadFeed(force)`.
  - Module constants: `FEED_LIMIT_PER_PODCAST = 20`, `FEED_PAGE_SIZE = 30`, `FEED_MAX_AGE_DAYS = 30`, `SKELETON_COUNT = 6`.
- Template: `home.page.html` (pull-to-refresh, favorite stations from `prefs.favoriteStations()`, trending, feed).

## Invariants
- `feedEpisodes` includes only episodes released within the last `FEED_MAX_AGE_DAYS` (episodes without `releaseDate` are kept), capped at `displayCount`. It is filtered by publish date only, never by listening history (issue #256).
- Feed reload deduplication (#240/#253):
  - The subscription `effect` reads `lastLoadedSubIds` with `untracked()`. It calls `loadFeed(true)` only when the sorted, comma-joined subscription IDs change and at least one subscription exists.
  - `loadFeed` snapshots `lastLoadedSubIds` before fetching.
  - A forced load that arrives while another load is in flight sets `pendingFeedRefresh`, which triggers one follow-up load when the current one completes.
- `ionViewWillEnter` skips the load when `isFeedLoading()` is already true.
- `loadFeed` returns immediately when there are no subscriptions.
- Per-podcast episode source: if `feedUrl` is set, RSS is used (first 20 episodes, with `podcastTitle` filled in from the podcast). It falls back to iTunes `getPodcastEpisodes` when RSS errors or returns no episodes. Per-podcast errors resolve to `[]`, so one failing feed does not break the whole `forkJoin`.
- `feedError` is set only when every podcast returns zero episodes, or when the `forkJoin` errors.
- Trending loads on init only when `store.trending()` is empty.
- `playEpisode` always calls `clearQueue()` first. When `prefs.autoQueueEnabled()` is true, it then queues every episode after the selected one in the unfiltered feed (`allFeedEpisodes()`), including episodes hidden by the age filter.
- `hasMoreFeed` and `hiddenFeedCount` are also computed from the unfiltered feed, so "load more" can appear when no newer episodes remain ([#386](https://github.com/bndF1/wavely/issues/386)).

## Side Effects
- Network: `PodcastApiService.getTrendingPodcasts(25, undefined, country)`, `getEpisodesFromRss(feedUrl, id)`, `getPodcastEpisodes(id, 20)`.
- Store mutations: `PodcastsStore.setLoading`, `setTrending`, `setError`; `PlayerStore.clearQueue`, `addToQueue`, `play`.
- UI: `PlayerModalService.open()` after playing an episode or station.
- Navigation: `/podcast/:id` and `/tabs/discover` (both `navigateToSearch` and `navigateToBrowse` go there).

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/home`
