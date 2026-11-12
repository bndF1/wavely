# Radio Feature

## Overview
Radio tab page (`wavely-radio`) for live internet radio. It lists stations by country, offers tag-chip filtering and debounced global station search, and lets the user favorite stations; favorites are synced to Firestore for signed-in users. Playing a station converts it to a live `Episode` for `PlayerStore`.

## Interface
- `RadioPage` (`radio.page.ts`) - OnPush standalone component, selector `wavely-radio`; implements `OnDestroy`.
  - Exposed: `countryService: CountryService`, `prefs: UserPreferencesService`.
  - Signals: `stations`, `isLoading`, `error`, `selectedTag`, `searchQuery`.
  - Computed: `isSearchMode`, `availableTags` (`'All'` followed by up to `MAX_TAG_CHIPS = 14` most frequent tags, capitalized), `filteredStations`, `favoriteStations`.
  - Template-facing methods: `onSearchInput(event)`, `onSearchClear()`, `selectTag(tag)`, `playStation(station)`, `onToggleFavorite(station, event)`, `isStationFavorite(stationuuid)`, `retry()`, `presentCountryPicker()`, getter `currentMarketName`.
  - Module constants: `SKELETON_COUNT = 8`, `MAX_TAG_CHIPS = 14`, `ALL_TAG = 'All'`, `SEARCH_LIMIT = 60`.
- Template: `radio.page.html`.

## Invariants
- Search mode means `searchQuery().trim()` is non-empty. In search mode, tag chips and the favorites section are empty and `filteredStations` returns the raw search results.
- Tag matching is case-insensitive on comma-separated `station.tags`.
- Search is debounced by 350 ms and uses `switchMap`. Clearing the query re-emits `country$` but does not cancel a pending or in-flight search, so late search results can overwrite the country list ([#382](https://github.com/bndF1/wavely/issues/382)).
- A country load resets `selectedTag` to `'All'`. After each successful country load, the page calls `prefs.migrateLegacyFavorites(stations)`.
- Changing country through the picker clears `searchQuery`.
- `onToggleFavorite` stops event propagation so the row does not start playback.
- The Favorites section renders only when the station list has loaded and is non-empty after filtering.
- Streams complete on `destroy$` in `ngOnDestroy`.

## Side Effects
- Network: `RadioApiService.getStationsByCountry(country)`, `searchStations(q, 60)`, and `registerClick(stationuuid)` (fire-and-forget on play).
- Player: `PlayerStore.play(radioStationToEpisode(station))`.
- Favorites persistence: `RadioFavoritesSyncService.syncToggle(station, uid | null)` (Firestore when a uid exists) and `UserPreferencesService.migrateLegacyFavorites`.
- Global state: `CountryService.setCountry` from the action sheet.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/radio`
- Note: this directory currently has no `*.spec.ts`, so the scoped command reports "No tests found". Run `bunx nx test wavely` for the full suite.
