# Discover Feature

## Overview
Discover tab page (`wavely-discover`). It combines debounced podcast search (results in `PodcastsStore`, with persisted recent-search history) with the same chart sections and category chips as Browse, all scoped to the selected country.

## Interface
- `DiscoverPage` (`discover.page.ts`) - OnPush standalone component, selector `wavely-discover`; implements `OnDestroy`.
  - Injected and exposed: `store: PodcastsStore`, `countryService: CountryService`.
  - Signals and state: `searchTerm`, `selectedCategory`, `topPodcasts`, `featuredPodcasts`, `newNoteworthyPodcasts`, `isBrowseLoading`, `browseError`, computed `hasActiveSearch`, plain field `recentSearches: string[]`.
  - Template-facing methods: `onSearchInput(event)`, `onSearchClear()`, `useRecentSearch(term)`, `removeRecentSearch(term, event)`, `clearRecentSearches()`, `selectCategory(category)`, `retryBrowse()`, `retrySearch()`, `navigateToPodcast(podcast)`, `presentCountryPicker()`, getter `currentMarketName`.
  - Module constants: `FEATURED_GENRE_ID = 1489`, `NOTEWORTHY_GENRE_ID = 1318`, `DEBOUNCE_MS = 300`, skeleton counts.
- Depends on `PODCAST_CATEGORIES` / `PodcastCategory` from `../browse/browse.constants.ts` (see the [Browse contract](../browse/EGM.md)).
- Template: `discover.page.html`.

## Invariants
- Search input is debounced by `DEBOUNCE_MS` (300 ms) and passed through `distinctUntilChanged` and `switchMap`; terms are trimmed before use.
- An empty or whitespace term clears results through `store.setQuery('')` and `store.setSearchResults([], '')` without a network call.
- A query is added to search history only when it returns at least one result.
- As in Browse, only category `id === 0` reloads charts in place; other categories navigate to `/browse/category/:id`. The tapped category stays selected afterwards, so tapping the same chip again after returning to the tab does nothing.
- Changing country always reloads the charts. It is meant to re-run the active search too, but `distinctUntilChanged` drops the repeated term, so the search does not run again. `retrySearch()` has the same problem ([#381](https://github.com/bndF1/wavely/issues/381)).
- Streams complete on `destroy$` in `ngOnDestroy`.

## Side Effects
- Network: `PodcastApiService.searchPodcasts(term, country)`; `PodcastApiService.getTrendingPodcasts(25 | 5 | 10, genre?, country)` inside a `forkJoin`.
- Store mutations: `PodcastsStore.setQuery`, `setSearchResults`, `setLoading`, `setError`.
- Persistence through `SearchHistoryService`: `getHistory`, `addQuery`, `removeQuery`, `clearAll`.
- Global state: `CountryService.setCountry` from the country picker action sheet.
- Navigation: `/podcast/:id`, `/browse/category/:id`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/discover`
- Note: this directory currently has no `*.spec.ts`, so the scoped command reports "No tests found". Run `bunx nx test wavely` for the full suite.
