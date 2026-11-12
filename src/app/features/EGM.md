# Features

## Overview
Route-level UI features of the Wavely Angular/Ionic app. Each subdirectory holds standalone components (mostly OnPush) that are lazy-loaded from `src/app/app.routes.ts`:
- `/login` - Login.
- `/tabs` (behind `authGuard`) - Tabs shell, with children `home`, `discover`, and `radio`. The child `library` is also declared there; `browse` and `search` redirect to `discover`.
- `/browse/category/:genreId` - Category Detail.
- `/podcast/:id` - Podcast Detail.
- `/publisher/:artistId` - Publisher.
- `/settings` (behind `authGuard`) - Settings.
- `/e2e-auth/:token` - E2E Auth, registered only when `environment.useEmulators` is true.

Features hold only view state, in signals or plain fields. Shared state lives in the NgRx signal stores under `src/app/store` (`PlayerStore`, `PodcastsStore`, `AuthStore`, `HistoryStore`, `LayoutStore`). I/O goes through `src/app/core/services` (`PodcastApiService`, `RadioApiService`, the sync services, `CountryService`, `UserPreferencesService`, `PlayerModalService`). This directory contains no source files directly.

## Subdirectories & Boundaries
- Browse: [./browse/EGM.md](./browse/EGM.md) - shared `PODCAST_CATEGORIES` constants and `BrowsePage` (charts plus radio; currently unrouted).
  - Category Detail: [./browse/category-detail/EGM.md](./browse/category-detail/EGM.md) - `CategoryDetailPage`, trending podcasts for one genre with "load more".
- Discover: [./discover/EGM.md](./discover/EGM.md) - `DiscoverPage`, with debounced podcast search into `PodcastsStore`, recent-search history, country-scoped charts, and category chips.
- E2E Auth: [./e2e-auth/EGM.md](./e2e-auth/EGM.md) - `E2eAuthComponent`, emulator-only custom-token sign-in for Playwright.
- Home: [./home/EGM.md](./home/EGM.md) - `HomePage`, with trending podcasts, favorite stations, and a deduplicated new-episodes feed from subscriptions (RSS first, iTunes fallback).
- Library: [./library/EGM.md](./library/EGM.md) - `LibraryPage`, with subscriptions, filtered listening history synced to Firestore, and sign-out.
- Login: [./login/EGM.md](./login/EGM.md) - `LoginPage`, Google sign-in with effect-driven redirect.
- Player: [./player/EGM.md](./player/EGM.md) - desktop, full (modal), and mini player views over `PlayerStore`.
- Podcast Detail: [./podcast-detail/EGM.md](./podcast-detail/EGM.md) - `PodcastDetailPage`, with metadata, subscribe toggle, infinite episode list, play and queue actions.
- Publisher: [./publisher/EGM.md](./publisher/EGM.md) - `PublisherPage`, all podcasts by one iTunes artist.
- Radio: [./radio/EGM.md](./radio/EGM.md) - `RadioPage`, with stations by country, tag filters, search, and favorites sync.
- Settings: [./settings/EGM.md](./settings/EGM.md) - `SettingsPage`, for theme, auto-queue, and language.
- Tabs: [./tabs/EGM.md](./tabs/EGM.md) - `TabsComponent`, the authenticated layout shell with tab bar, desktop sidebar, offline banner, and player surfaces.

## Cross-Feature Notes
- Country-scoped pages (Browse, Discover, Category Detail, Radio, Home trending, Podcast Detail) read `CountryService.country()`. The country pickers write it back with `setCountry`.
- `UserPreferencesService.autoQueueEnabled()`, set in Settings, controls whether Home and Podcast Detail queue the following episodes. The order is `PlayerStore.clearQueue()`, then `addToQueue()` for each following episode, then `play()`.
- Known bugs: Discover search retry and country re-search ([#381](https://github.com/bndF1/wavely/issues/381)), Radio search cancellation ([#382](https://github.com/bndF1/wavely/issues/382)), Publisher param reset ([#383](https://github.com/bndF1/wavely/issues/383)), Home load-more count ([#386](https://github.com/bndF1/wavely/issues/386)).
- Run all feature tests: `bunx nx test wavely --testPathPatterns=src/app/features`
