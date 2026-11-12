# Category Detail Page

## Overview
Routed standalone page (`wavely-category-detail`) that lists trending podcasts for a single iTunes genre, read from the `genreId` route parameter, with client-side "load more" pagination. Routed at `/browse/category/:genreId` (lazy-loaded in `src/app/app.routes.ts`) and opened from the category chips in `DiscoverPage` (and the currently unrouted `BrowsePage`).

## Interface
- `CategoryDetailPage` (`category-detail.page.ts`) - OnPush standalone component, selector `wavely-category-detail`.
  - Signals: `genreId`, `genreName`, `podcasts`, `visibleCount`, `isLoading`, `error`.
  - Computed: `visiblePodcasts` (first `visibleCount` podcasts), `canLoadMore`.
  - Template-facing methods: `loadMore()`, `retry()`, `navigateToPodcast(podcast)`.
- Constants: `SKELETON_COUNT = 6`, `PAGE_SIZE = 12` (module-private).
- Template: `category-detail.page.html` (skeletons, error `EmptyStateComponent`, `PodcastCardComponent` grid, "load more" button).

## Invariants
- `genreId` must parse to a positive integer (`Number.isInteger(raw) && raw > 0`); otherwise `genreId` is set to `null`, `genreName` to `'Category'`, an "Invalid category" error is shown, and no API call is made.
- `genreName` is looked up in `PODCAST_CATEGORIES` from `../browse.constants`; unknown IDs fall back to `'Category'`.
- Every route param change resets state (`isLoading=true`, `error=null`, `podcasts=[]`, `visibleCount=PAGE_SIZE`); `switchMap` cancels in-flight loads.
- `visibleCount` never exceeds `podcasts().length` after a load or `loadMore()`.
- `retry()` does nothing except re-set the invalid-category error when `genreId()` is null. With a valid id it subscribes outside the `switchMap` pipeline, so a later param change does not cancel the retry.
- Subscriptions are torn down with `takeUntilDestroyed(DestroyRef)`.

## Side Effects
- Network: `PodcastApiService.getTrendingPodcasts(50, genreId, CountryService.country())` on load and on `retry()`; errors are caught and surfaced through `error`.
- Navigation: `navigateToPodcast` calls `Router.navigate(['/podcast', podcast.id])`.
- Registers ionicons `searchOutline`, `alertCircleOutline`, `refreshOutline` through `addIcons`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/browse/category-detail`
