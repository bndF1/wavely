# Browse Feature

## Overview
Browse page (`wavely-browse`) showing three podcast chart sections (Top, Featured/News, New & Noteworthy/Technology) plus live radio stations for the user's selected country. Also owns the shared `PODCAST_CATEGORIES` genre list that `DiscoverPage` and `CategoryDetailPage` import.

Note: `BrowsePage` is not currently referenced by `src/app/app.routes.ts` (`/tabs/browse` redirects to `discover`), and no non-spec code imports it. `DiscoverPage` covers the same chart sections. The `category-detail` child page and `browse.constants.ts` are still in use.

## Interface
- `browse.constants.ts`
  - `interface PodcastCategory { id: number; name: string; color: string }`
  - `PODCAST_CATEGORIES: PodcastCategory[]` - 12 entries; `id: 0` is the "All" pseudo-category, the others are iTunes genre IDs (for example `1489` News, `1318` Technology).
- `browse.page.ts`
  - `BrowsePage` - OnPush standalone component, selector `wavely-browse`; implements `OnDestroy`.
  - Re-exports `PodcastCategory` (type) and `PODCAST_CATEGORIES`.
  - Signals: `selectedCategory`, `topPodcasts`, `featuredPodcasts`, `newNoteworthyPodcasts`, `isLoading`, `error`, `radioStations`, `isRadioLoading`, `radioError`.
  - Template-facing methods: `selectCategory(category)`, `presentCountryPicker()`, `retryCurrentCategory()`, `navigateToPodcast(podcast)`, `playStation(station)`, `retryRadio()`, getter `currentMarketName`.
  - Module constants: `FEATURED_GENRE_ID = 1489`, `NOTEWORTHY_GENRE_ID = 1318`, `SKELETON_COUNT = 6`, `CHIP_SKELETON_COUNT = 6`.
- Template: `browse.page.html`.
- Subdirectory: [category-detail](./category-detail/EGM.md) - per-genre podcast list at `/browse/category/:genreId`.

## Invariants
- Only category `id === 0` ("All") reloads in place; any other category navigates to `/browse/category/:id` and does not enter the loading pipeline. The tapped category stays selected, so `retryCurrentCategory()` then navigates again instead of reloading the charts.
- `selectCategory` is a no-op when the category is already selected.
- The podcast pipeline (`category$`) and radio pipeline (`radioCountry$`) each use `switchMap`, so a newer country or category cancels the in-flight request.
- The three chart requests run in one `forkJoin`; any failure sets `error` and empties all three lists.
- Both pipelines read the country from `CountryService.country()` and stop on `destroy$` in `ngOnDestroy`.
- `PODCAST_CATEGORIES[0]` must stay the `id: 0` "All" entry; `BrowsePage` and `DiscoverPage` use it as the initial selection.

## Side Effects
- Network: `PodcastApiService.getTrendingPodcasts(25 | 5 | 10, genre?, country)`; `RadioApiService.getStationsByCountry(country)`; `RadioApiService.registerClick(stationuuid)` (fire-and-forget) when a station is played.
- Player: `PlayerStore.play(radioStationToEpisode(station))`.
- Global state: the country picker (`ActionSheetController`, built from `PODCAST_MARKETS`) calls `CountryService.setCountry(code)`, then reloads charts and radio.
- Navigation: `/podcast/:id`, `/browse/category/:id`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/browse`
