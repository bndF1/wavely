# core

## Overview

The application's non-UI core:

- Firebase authentication (wrapper and route guard)
- shared domain models
- root-provided services for audio playback, external catalog APIs (iTunes,
  Radio Browser), Firestore per-user sync, and browser-persisted preferences

Reactive in-memory state lives in [`store/`](../store/EGM.md). Services here
read those NgRx signal stores and update them.

## Subdirectories & Boundaries

- auth: [./auth/EGM.md](./auth/EGM.md) - `AuthService`, a wrapper over AngularFire Auth
  (`user$`, `signInWithGoogle`, `signOut`, `getCurrentUser`). It holds no state
  and lets errors propagate to callers.
- guards: [./guards/EGM.md](./guards/EGM.md) - `authGuard` (`CanActivateFn`). It
  allows navigation for signed-in users and otherwise returns a `UrlTree` to `/login`.
- models: [./models/EGM.md](./models/EGM.md) - type-only interfaces `Podcast`, `Episode`
  (`isLive` marks radio streams), `RadioStation`, plus the unused `PlaybackProgress`
  and `Subscription`.
- services: [./services/EGM.md](./services/EGM.md) - groups of services:
  - Playback: `AudioService` (the single HTMLAudioElement and Media Session).
  - External APIs: `PodcastApiService` (iTunes, RSS through the corsproxy.io
    fallback) and `RadioApiService`.
  - Firestore sync: `ProgressSyncService`, `HistorySyncService`,
    `SubscriptionSyncService`, `RadioFavoritesSyncService`, all under `users/{uid}/...`.
  - Local preferences: `CountryService`, `LanguageService`, `ThemeService`,
    `UserPreferencesService`, `SearchHistoryService`, `NetworkService`.
  - UI helpers: `KeyboardShortcutsService`, `PlayerModalService`.
  - Configuration: `firebaseConfig`, read from `NG_APP_FIREBASE_*` through
    `import.meta.env`. No module imports it; `app.config.ts` uses
    `environment.firebase`.
