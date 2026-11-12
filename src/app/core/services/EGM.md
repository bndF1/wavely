# core/services

## Overview

Root-provided (`providedIn: 'root'`) Angular services for:

- audio playback (the HTMLAudioElement and Media Session)
- external catalog APIs (iTunes, Radio Browser)
- Firestore persistence of per-user data (progress, history, subscriptions, radio favorites)
- browser preferences (country, language, theme, prefs, search history)
- UI helpers (keyboard shortcuts, network status, full-player modal)

Most services guard browser-only APIs with `isPlatformBrowser(PLATFORM_ID)`.
In-memory state lives in the NgRx signal stores under
[`store/`](../../store/EGM.md). The `*-sync` services own Firestore writes and
update those stores.

## Interface

### Playback
- `AudioService` (`audio.service.ts`): owns the app's single `HTMLAudioElement`.
  - Signal `effect`s on `PlayerStore` drive:
    - `currentEpisode` (load the src and restore the saved position)
    - `isPlaying` (play/pause)
    - `playbackRate`
    - `effectiveVolume`
    - `currentTime` (seek when the difference is more than 1s)
  - Audio events feed `PlayerStore.updateProgress` (`timeupdate`, `durationchange`),
    `pause`, and `playNext`. On `play` it records a history entry
    (`HistorySyncService.recordPlay`, `completed: false`). On `ended` it calls
    `ProgressSyncService.markCompleted`, records a completed history entry, and
    then calls `PlayerStore.playNext()`. History needs a uid and a non-live episode.
  - It registers Media Session action handlers: play, pause, stop, seekbackward,
    seekforward, seekto, previoustrack, nexttrack. `previoustrack` only restarts
    the episode (`seek(0)` when more than 5 s have played). The seek offsets
    default to 15 s and 30 s.
  - Public static: `AudioService.formatTime(seconds): string` (`m:ss` / `h:mm:ss`; `'0:00'` for invalid input).
- `PlayerModalService` (`player-modal.service.ts`): `isDesktop` getter (`window.innerWidth >= 1024`).
  `open()` lazy-imports `FullPlayerComponent` and presents an Ionic modal with `cssClass: 'full-player-modal'`.
  On desktop, while already opening, or when that modal is already on top, it does nothing.
- `KeyboardShortcutsService` (`keyboard-shortcuts.service.ts`): adds a document `keydown` listener.
  - `Space` toggles play/pause, `j` calls `skipBack(15)`, `k` calls `skipForward(30)`,
    and `[` calls `LayoutStore.toggleSidebar()`.
  - Shortcuts are ignored while focus is in an input, textarea, select,
    contenteditable, `ion-searchbar` or `ion-input`, or when Ctrl, Meta or Alt
    is held. Space, `j` and `k` need a loaded episode.
  - It removes the listener in `ngOnDestroy`.

### External APIs
- `PodcastApiService` (`podcast-api.service.ts`), backed by the iTunes Search/Lookup/RSS APIs:
  - `detectCountry(): string` reads the region from `navigator.language`, falls
    back to the private `LANGUAGE_COUNTRY_MAP`, and defaults to `'us'`.
  - `searchPodcasts(term, country?)`, `lookupPodcast(itunesId, country?)`,
    `getTrendingPodcasts(limit = 25, genreId?, country?)`, `getPublisherPodcasts(artistId, country?)`,
    `getPodcastEpisodes(itunesId, limit = 200, country?)`. All return `Observable<Podcast[] | Podcast | Episode[]>`.
  - `getEpisodesFromRss(feedUrl, podcastId): Observable<Episode[]>` tries a
    direct fetch first, then the corsproxy.io fallback, and parses the XML with
    `DOMParser`.
- `RadioApiService` (`radio-api.service.ts`), backed by the Radio Browser API (`all.api.radio-browser.info`):
  `getStationsByCountry(countryCode, limit = 100)`, `searchStations(query, limit = 30)`, `registerClick(stationuuid)`.
- `radioStationToEpisode(station): Episode & { isLive: true }` (exported function in `radio-api.service.ts`).

### Firestore sync (per-user)
- `ProgressSyncService` (`progress-sync.service.ts`) uses `users/{uid}/progress/{episodeId}`:
  - Methods: `loadProgress(episodeId, uid)`, `scheduleWrite(episodeId, position, duration, uid)`, `flush()`, and
    `markCompleted(episodeId, duration, uid)`.
  - Exported type: `EpisodeProgress`.
- `HistorySyncService` (`history-sync.service.ts`) uses `users/{uid}/history/{episodeId}`:
  `recordPlay(entry, uid)`, `updateEntry(episodeId, partial, uid)`, `loadHistory(uid)`, `clearHistory(uid)`.
- `SubscriptionSyncService` (`subscription-sync.service.ts`) uses `users/{uid}/subscriptions/{podcastId}`:
  `loadFromFirestore(uid, isStillCurrentUser)`, `addSubscription(podcast, uid)`, `removeSubscription(podcastId, uid)`,
  `clearSubscriptions()`.
- `RadioFavoritesSyncService` (`radio-favorites-sync.service.ts`) uses `users/{uid}/favoriteStations/{stationuuid}`:
  `loadFromFirestore(uid, isStillCurrentUser)`, `syncToggle(station, uid)`, `addFavorite(station, uid)`,
  `removeFavorite(stationuuid, uid)`, `clearFavorites()`.

### Local preferences
- `CountryService` (`country.service.ts`):
  - `country` signal, `setCountry(code)`, and `getFlag(code)` (emoji flag; `'🌍'` for invalid codes).
  - Also exports `PodcastMarket` and the `PODCAST_MARKETS` list.
- `LanguageService` (`language.service.ts`):
  - `supported: SupportedLanguage[]` (ca, en, es, fr, de, pt), the `current` signal, and `setLanguage(code)`.
  - It configures `@ngx-translate/core` `TranslateService`.
- `ThemeService` (`theme.service.ts`): `mode` signal of `ThemeMode` (`'system' | 'light' | 'dark'`) and `setMode(mode)`.
- `UserPreferencesService` (`user-preferences.service.ts`):
  - Signals: `autoQueueEnabled`, `favoriteStations`, `pendingMigrationIds`.
  - Methods: `setAutoQueueEnabled`, `addFavoriteStation`, `removeFavoriteStation`, `setFavoriteStations`,
    `isFavorite`, and `migrateLegacyFavorites`.
  - `toggleFavorite` is `@deprecated`; use `RadioFavoritesSyncService.syncToggle()` instead.
- `SearchHistoryService` (`search-history.service.ts`): `getHistory()`, `addQuery(term)`, `removeQuery(term)`, `clearAll()`.
- `NetworkService` (`network.service.ts`): `isOnline` signal.

### Configuration
- `firebaseConfig` (`firebase.config.ts`): exported Firebase config object.
  Every field reads `import.meta.env?.['NG_APP_FIREBASE_*'] ?? ''`, so nothing
  is hardcoded. No module currently imports it. The app initialises Firebase
  from `environment.firebase` in `src/app/app.config.ts` instead.
  **Security:** the values are build-time credentials. Never inline, print, or
  commit them.

## Invariants

- **Single audio element:** only `AudioService` creates and controls an
  `HTMLAudioElement`, and only in the browser. Other code changes playback by
  mutating `PlayerStore`.
- **Episode/audio race guard:** DOM audio handlers use the private
  `activeEpisodeId` / `activeEpisodeIsLive`, not `store.currentEpisode()`.
  These fields are set only after `audio.src` is assigned. This prevents writing
  a timestamp under the wrong episode ID.
- **The `seeking` flag** stops `timeupdate` from overwriting a programmatic seek.
  It is reset on `seeked`, `abort`, and `emptied`.
- **Position restore:**
  - A saved position is applied only if it is greater than 1s and the episode
    has not changed while the fetch was in flight.
  - If metadata has not loaded yet, the restore is deferred to `loadedmetadata`.
- **Live streams** (`isLive`) skip progress restore, progress writes, completion
  marking, and history recording.
- `play()` failures (autoplay or element error) call `PlayerStore.pause()`.
- **Progress writes:**
  - Throttled to at most one per `WRITE_INTERVAL_MS` (5000 ms).
  - Positions under `MIN_POSITION_SECONDS` (2) are ignored.
  - `flush()` runs on pause, episode change, and episode clear.
  - `flush()` never writes `completedAt`; only `markCompleted()` sets it, so
    completion set on another device is not overwritten.
  - `markCompleted()` cancels any pending throttled write before writing.
  - `loadProgress` returns 0 for completed episodes.
- **Unauthenticated users:** the write methods return early (no Firestore
  access) when `uid` is null or empty. Subscription and favorite mutations still
  update local state, and `clearHistory('')` clears `HistoryStore` locally.
  `SubscriptionSyncService.loadFromFirestore` and
  `RadioFavoritesSyncService.loadFromFirestore` do **not** check `uid`. Their
  only caller (`AuthStore`) invokes them with a signed-in user.
- **Optimistic updates with rollback:**
  - Subscriptions and favorites update the store or prefs first.
  - On Firestore error they roll back.
  - Favorite rollback also requires `auth.currentUser?.uid === uid`.
  - `SubscriptionSyncService.addSubscription` always removes the podcast on
    error, even if it was already subscribed before the call.
- **Stale-load guard:** `loadFromFirestore(uid, isStillCurrentUser)` drops
  results if the user changed mid-flight. It merges local-only items with the
  remote ones. For favorites, local-only items are written back to Firestore.
- **Undefined fields:** values that are `undefined` are removed before
  `setDoc`, because Firestore rejects them.
- **Input validation:**
  - `CountryService` accepts only `/^[a-z]{2}$/` codes.
  - `LanguageService.setLanguage` accepts only `supported` codes.
  - `ThemeService.setMode` accepts only the three `ThemeMode` values.
- `SearchHistoryService` dedupes case-insensitively and keeps at most
  `MAX_ITEMS` (8) entries, newest first.
- `getEpisodesFromRss` returns `[]` during SSR and when both the direct fetch
  and the proxy fetch fail. It never errors.
- `lookupPodcast` throws `Error('Podcast not found')` on empty results.
- `RadioApiService.registerClick` swallows errors. It is best-effort, and the
  Radio Browser ToS require the call.

## Side Effects

- **Network (HTTP):**
  - `https://itunes.apple.com` (search, lookup, RSS charts).
  - `https://corsproxy.io/?` (RSS fallback).
  - The podcast RSS feed URLs themselves.
  - `https://all.api.radio-browser.info/json`.
- **Firestore reads and writes** under `users/{uid}/`:
  - `progress`
  - `history`
  - `subscriptions`
  - `favoriteStations`
- **localStorage keys:**
  - `wavely:country`
  - `wavely:language`
  - `wavely:theme`
  - `wavely:prefs`
  - `wavely_search_history`
- **DOM and browser APIs:**
  - `ThemeService` toggles the `ion-palette-dark` and `force-light-theme`
    classes on `<html>`.
  - `KeyboardShortcutsService` adds a document `keydown` listener.
  - `NetworkService` adds window `online`/`offline` listeners.
  - `AudioService` sets `navigator.mediaSession` metadata on every episode
    change and `playbackState` on every play/pause. Only `setPositionState` is
    throttled (`MEDIA_SESSION_POSITION_UPDATE_MS`, 5000 ms).
- **Ionic modal:** `PlayerModalService.open()` presents an Ionic `ModalController`
  modal.
- **Store mutations:**
  - `PlayerStore` (from `AudioService` and `KeyboardShortcutsService`)
  - `LayoutStore` (from `KeyboardShortcutsService`)
  - `HistoryStore` (from `HistorySyncService`)
  - `PodcastsStore` (from `SubscriptionSyncService`)
- **Console:** `console.error` logging on caught failures.

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/core/services`
