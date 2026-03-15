# Wavely — Software Design Document

> **Version:** 1.1.0 | **Last updated:** March 2026  
> **Status:** Living document — update with every milestone

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Route Structure](#4-route-structure)
5. [State Management](#5-state-management)
6. [Service Layer](#6-service-layer)
7. [Data Models](#7-data-models)
8. [Feature Pages](#8-feature-pages)
9. [Shared Components](#9-shared-components)
10. [Authentication Flow](#10-authentication-flow)
11. [Firebase Integration](#11-firebase-integration)
12. [External API Integration](#12-external-api-integration)
13. [Audio Playback Architecture](#13-audio-playback-architecture)
14. [Angular Patterns](#14-angular-patterns)
15. [Environment Configuration](#15-environment-configuration)
16. [Testing Strategy](#16-testing-strategy)
17. [CI/CD Pipeline](#17-cicd-pipeline)
18. [Deployment](#18-deployment)
19. [Next Milestone — Discovery & Library](#19-next-milestone--discovery--library)
20. [Known Limitations & Tech Debt](#20-known-limitations--tech-debt)

---

## 1. Executive Summary

**Wavely** is a Google Podcasts-inspired cross-platform podcast application targeting **Android, iOS, and Web**. It is built as a true multi-platform product using Angular + Ionic + Capacitor, with Firebase for authentication and cloud persistence.

| Attribute | Value |
|-----------|-------|
| Current version | `v1.2.0` |
| Production URL | https://wavely-f659c.web.app |
| Landing page | https://bndF1.github.io/wavely |
| Repository | https://github.com/bndF1/wavely |
| Platforms | Web PWA · Android (Capacitor) · iOS (Capacitor) |

**v1.2.0 Features (Discovery & Library):**
- Recent searches history (localStorage, last 8 queries)
- Library episode filtering (All / Unplayed / In Progress)
- Browse category detail pages (`/browse/category/:genreId`)

**MVP Features (v1.1.0):**
- Google OAuth login
- Podcast discovery via iTunes Search API (country-aware)
- Full-screen and mini audio player with progress persistence
- Media Session API (lockscreen / notification controls)
- Up Next queue with auto-advance
- Listening history (Firestore-synced)
- Subscriptions (Firestore-synced)
- Offline resilience with error states
- PWA (service worker, installable)
- Lighthouse CI gate (performance + accessibility)

---

## 2. Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Workspace | Nx | 22.x |
| Framework | Angular standalone | 21.2.x |
| Mobile UI | Ionic Framework | 8.8.1 |
| Native bridge | Capacitor | 8.2.0 |
| State management | NgRx SignalStore | 21.0.1 |
| Auth & DB | Firebase SDK + AngularFire | 12.10.0 / 20.0.1 |
| Podcast data | iTunes Search API | — |
| Testing (unit) | Jest | built-in |
| Testing (E2E) | Playwright | built-in |
| CI/CD | GitHub Actions | — |
| Hosting | Firebase Hosting | — |
| Landing page | GitHub Pages | — |
| Error tracking | Sentry | — |

---

## 3. Architecture Overview

```
src/app/
├── app.config.ts              ← Bootstrap providers (Firebase, Router, Ionic, SW, Sentry)
├── app.routes.ts              ← Route tree (lazy-loaded)
├── app.routes.server.ts       ← SSR render modes
│
├── core/
│   ├── auth/
│   │   └── auth.service.ts    ← Firebase Auth wrapper (Google OAuth)
│   ├── guards/
│   │   └── auth.guard.ts      ← Route protection
│   ├── models/
│   │   └── podcast.model.ts   ← Domain interfaces (Podcast, Episode, etc.)
│   └── services/
│       ├── audio.service.ts            ← HTMLAudioElement owner, Media Session
│       ├── history-sync.service.ts     ← Firestore history persistence
│       ├── network.service.ts          ← Online/offline signal
│       ├── podcast-api.service.ts      ← iTunes API + country detection
│       ├── progress-sync.service.ts    ← Throttled playback position → Firestore
│       ├── subscription-sync.service.ts ← Firestore subscription persistence
│       └── theme.service.ts            ← System/light/dark theme
│
├── features/
│   ├── browse/                ← Category browsing + trending
│   ├── e2e-auth/              ← Test-only custom token login
│   ├── episode-detail/        ← Episode playback UI
│   ├── home/                  ← Trending + featured
│   ├── library/               ← Subscriptions, history, profile
│   ├── login/                 ← Google OAuth entry
│   ├── player/
│   │   ├── full-player/       ← Fullscreen player modal
│   │   └── mini-player/       ← Persistent bottom bar
│   ├── podcast-detail/        ← Podcast info + episode list
│   ├── search/                ← iTunes search + country detection
│   └── tabs/                  ← Tab shell + mini-player host
│
├── shared/
│   └── components/
│       ├── empty-state/        ← "No results" UI
│       ├── error-state/        ← Error + retry UI
│       ├── offline-banner/     ← Dismissible offline warning
│       └── podcast-card/       ← Podcast display card
│
└── store/
    ├── auth/
    │   └── auth.store.ts       ← User session signal store
    ├── history/
    │   └── history.store.ts    ← Listening history signal store
    ├── player/
    │   └── player.store.ts     ← Playback state signal store
    └── podcasts/
        └── podcasts.store.ts   ← Search results + subscriptions signal store
```

### Data Flow Layers

```
UI Components
    ↕ signals / methods
Signal Stores (PlayerStore, PodcastsStore, AuthStore, HistoryStore)
    ↕ observables / async
Services (AudioService, PodcastApiService, Sync services)
    ↕
External (Firebase Firestore · iTunes API · Web Audio API · Media Session API)
```

---

## 4. Route Structure

```
/
├── ''                         → redirect /tabs (pathMatch: full)
├── login                      → LoginPage (Google OAuth)
├── e2e-auth/:token            → E2eAuthComponent (emulator only, tree-shaken in prod)
│
└── tabs (authGuard)           → TabsComponent + MiniPlayerComponent
    ├── ''                     → redirect home
    ├── home                   → HomePage
    ├── browse                 → BrowsePage
    ├── search                 → SearchPage
    └── library                → LibraryPage

/podcast/:id                   → PodcastDetailPage (lazy)
/episode/:id                   → EpisodeDetailPage (lazy)
```

**Route features:**
- All feature components are lazy-loaded via `loadComponent()`
- `PreloadAllModules` strategy — routes preload after initial render
- `authGuard` on `/tabs` — redirects unauthenticated users to `/login`
- No wildcard route (404s propagate to Firebase Hosting fallback)

---

## 5. State Management

All state lives in **NgRx SignalStore** (`@ngrx/signals`). No NgModules, no RxJS Subjects for state — only signals and `patchState`.

### 5.1 PlayerStore

**File:** `src/app/store/player/player.store.ts`

```typescript
interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying:      boolean;
  currentTime:    number;       // seconds
  duration:       number;       // seconds
  playbackRate:   number;       // 1 | 1.5 | 2
  queue:          Episode[];    // Up Next list
  isMinimised:    boolean;      // mini-player visibility
}
```

| Method | What it does |
|--------|-------------|
| `play(episode)` | Set episode, playing=true, time=0 |
| `pause()` / `resume()` | Toggle isPlaying |
| `seek(time)` | User-initiated time jump |
| `updateProgress(t, d)` | Internal audio event sync (not a seek) |
| `skipBack(15)` / `skipForward(30)` | Timed skips |
| `setPlaybackRate(rate)` | Speed change |
| `addToQueue(ep)` / `removeFromQueue(id)` / `clearQueue()` | Queue CRUD |
| `playNext()` | Advance queue, play first item |
| `toggleMinimise()` | Show/hide mini-player |
| `close()` | Clear episode, reset all state |

### 5.2 AuthStore

**File:** `src/app/store/auth/auth.store.ts`

```typescript
interface AuthState {
  user:    User | null;   // Firebase Auth User
  loading: boolean;
  error:   string | null;
}
// Computed: isAuthenticated, displayName, photoURL, email
```

**Side effects on auth change:**
- Sign in → load subscriptions + history from Firestore
- Sign out → clear in-memory subscriptions + history
- User switch (A→B) → clear A's data, load B's (race-guarded)

### 5.3 PodcastsStore

**File:** `src/app/store/podcasts/podcasts.store.ts`

```typescript
interface PodcastsState {
  searchResults: Podcast[];
  subscriptions: Podcast[];
  trending:      Podcast[];
  isLoading:     boolean;
  error:         string | null;
  searchQuery:   string;
}
```

### 5.4 HistoryStore

**File:** `src/app/store/history/history.store.ts`

```typescript
interface HistoryState {
  entries:   HistoryEntry[];   // auto-sorted by lastPlayedAt DESC
  isLoading: boolean;
}
```

`addOrUpdate(entry)` upserts and re-sorts automatically.

---

## 6. Service Layer

### 6.1 PodcastApiService

**Responsibilities:** iTunes Search API wrapper, country detection, model mapping.

| Method | Returns | Notes |
|--------|---------|-------|
| `detectCountry()` | `string` | Browser locale → ISO 3166-1 α-2 |
| `searchPodcasts(term, country?)` | `Observable<Podcast[]>` | Max 50 results |
| `lookupPodcast(itunesId)` | `Observable<Podcast>` | Single podcast details |
| `getTrendingPodcasts(limit, genreId?)` | `Observable<Podcast[]>` | iTunes RSS top chart |
| `getPodcastEpisodes(itunesId, limit)` | `Observable<Episode[]>` | Most recent episodes |

- Base URL: `https://itunes.apple.com`
- SSR-safe: no browser APIs on server
- No API key required (public iTunes API)

### 6.2 AudioService

**Responsibilities:** Owns the single `HTMLAudioElement`. Reacts to PlayerStore signals. Drives Media Session API.

**Reactive chain:**
```
PlayerStore.currentEpisode() signal changes
  → load audio.src
  → restore saved progress from ProgressSyncService (async)
  → play()

PlayerStore.isPlaying() signal changes
  → audio.play() | audio.pause()

audio timeupdate event
  → PlayerStore.updateProgress()
  → ProgressSyncService.scheduleWrite() (throttled 5s)

audio ended event
  → PlayerStore.playNext() (auto-advance queue)
  → HistorySyncService.recordPlay() (mark completed)
```

**Media Session handlers:** play, pause, stop, seekforward (30s), seekbackward (15s), seekto, previoustrack, nexttrack.

### 6.3 ProgressSyncService

**Path:** `users/{uid}/progress/{episodeId}`

| Method | Notes |
|--------|-------|
| `loadProgress(episodeId, uid)` | Returns saved position (0 if none or completed) |
| `scheduleWrite(episodeId, pos, dur, uid)` | Throttled — max 1 write per 5s |
| `flush()` | Immediate write (on pause/episode change) |
| `markCompleted(episodeId, dur, uid)` | Sets `completedAt` timestamp |

### 6.4 HistorySyncService

**Path:** `users/{uid}/history/{episodeId}`

| Method | Notes |
|--------|-------|
| `recordPlay(entry, uid)` | Upsert (merge) history entry |
| `loadHistory(uid)` | Returns entries sorted by lastPlayedAt DESC |
| `clearHistory(uid)` | Deletes all history docs for user |

### 6.5 SubscriptionSyncService

**Path:** `users/{uid}/subscriptions/{podcastId}`

| Method | Notes |
|--------|-------|
| `loadFromFirestore(uid, isStillCurrentUser)` | Stale-result guard prevents cross-user contamination |
| `addSubscription(podcast, uid)` | Optimistic update → Firestore write → rollback on error |
| `removeSubscription(podcastId, uid)` | Same optimistic pattern |
| `clearSubscriptions()` | In-memory clear only (on sign-out) |

### 6.6 ThemeService

Signal: `mode: signal<'system' | 'light' | 'dark'>`. Applies `ion-palette-dark` class to `<html>`. Persists to localStorage.

### 6.7 NetworkService

Signal: `isOnline: signal<boolean>`. Listens to `window` online/offline events. SSR-safe.

---

## 7. Data Models

**File:** `src/app/core/models/podcast.model.ts`

```typescript
interface Podcast {
  id:                string;   // iTunes collectionId
  title:             string;
  author:            string;
  description:       string;
  artworkUrl:        string;   // 600×600 preferred
  feedUrl:           string;   // RSS feed URL
  genres:            string[];
  episodeCount?:     number;
  latestReleaseDate?: string;  // ISO date
}

interface Episode {
  id:            string;       // iTunes trackId
  podcastId:     string;       // iTunes collectionId
  title:         string;
  description:   string;
  audioUrl:      string;       // playback URL
  imageUrl?:     string;
  podcastTitle?: string;       // added dynamically by components
  duration:      number;       // seconds
  releaseDate:   string;       // ISO date
  fileSize?:     number;       // bytes
}

interface PlaybackProgress {
  episodeId:   string;
  position:    number;    // seconds
  duration:    number;
  completed:   boolean;
  updatedAt:   Date;
}

interface HistoryEntry {
  episodeId:    string;
  episodeTitle: string;
  podcastTitle: string;
  imageUrl:     string;
  position:     number;
  duration:     number;
  lastPlayedAt: number;   // unix timestamp ms
  completed:    boolean;
}

interface Subscription {
  podcastId:    string;
  subscribedAt: Date;
  lastSeen?:    string;   // last episode ID seen
}
```

---

## 8. Feature Pages

All components: `standalone: true`, `inject()` DI, `ChangeDetectionStrategy.OnPush`.

| Route | Component | Key Dependencies | Responsibility |
|-------|-----------|-----------------|----------------|
| `/login` | LoginPage | AuthStore | Google OAuth entry, redirects on auth |
| `/tabs` | TabsComponent | PlayerStore | Tab shell, hosts MiniPlayerComponent |
| `/tabs/home` | HomePage | PodcastsStore, PodcastApiService | Trending feed, pull-to-refresh |
| `/tabs/browse` | BrowsePage | PodcastApiService | Category filter chips + trending per genre |
| `/tabs/search` | SearchPage | PodcastApiService, PodcastsStore | Debounced search, country toggle, global mode |
| `/tabs/library` | LibraryPage | AuthStore, PodcastsStore, HistoryStore | Subscriptions, history, theme, sign out |
| `/podcast/:id` | PodcastDetailPage | PodcastApiService, PodcastsStore, PlayerStore | Podcast info, episode list, subscribe/unsubscribe |
| `/episode/:id` | EpisodeDetailPage | PlayerStore | Episode info, play controls, add-to-queue |
| *(modal)* | FullPlayerComponent | PlayerStore | Full-screen player modal |
| *(in tabs)* | MiniPlayerComponent | PlayerStore | Compact player bar |
| `/e2e-auth/:token` | E2eAuthComponent | AuthService | Test-only: custom token sign-in |

---

## 9. Shared Components

| Component | Inputs | Outputs | Purpose |
|-----------|--------|---------|---------|
| `PodcastCardComponent` | `podcast` (required), `loading` | `cardClick` | Podcast tile (art + title + author) |
| `OfflineBannerComponent` | — | — | Dismissible offline warning |
| `EmptyStateComponent` | `message`, `icon`, `actionLabel?` | `action` | "No results" / empty list |
| `ErrorStateComponent` | `message`, `retryLabel?` | `retry` | Error message with retry button |

---

## 10. Authentication Flow

### Sign-In

```
1. User lands on /login (unauthenticated or redirected by authGuard)
2. User taps "Continue with Google"
3. LoginPage → authStore.signInWithGoogle()
4. AuthStore → authService.signInWithGoogle()
5. Firebase Auth → signInWithPopup(GoogleAuthProvider)
6. Firebase Auth state changes → user$ emits user
7. AuthStore.init() listener fires:
   - patchState({ user, loading: false })
   - subscriptionSync.loadFromFirestore(uid, guard)
   - historySyncService.loadHistory(uid) → historyStore.setEntries()
8. LoginPage effect detects isAuthenticated() → router.navigate(['/tabs/home'])
```

### Route Protection

```typescript
// authGuard: CanActivateFn
return user(auth).pipe(
  take(1),
  map(u => u ? true : router.createUrlTree(['/login']))
);
```

Applied to `/tabs` — protects all child routes (home, browse, search, library).

### Sign-Out

```
1. LibraryPage → authStore.signOut()
2. AuthStore → authService.signOut() (Firebase sign out)
3. user$ emits null
4. AuthStore clears user, subscriptions, history
5. Redirect to /login
```

### E2E Auth

For Playwright tests (`environment.useEmulators = true`):

```
1. global-setup.ts creates Firebase Admin custom token
2. Playwright navigates to /e2e-auth/{token}
3. E2eAuthComponent calls signInWithCustomToken(auth, token)
4. Auth state stored via storageState (Playwright context)
```

---

## 11. Firebase Integration

### Firestore Schema

```
users/{uid}/
├── subscriptions/{podcastId}      Podcast object (full)
│     ├── id, title, author, description
│     ├── artworkUrl, feedUrl, genres
│     └── subscribedAt
│
├── progress/{episodeId}           Playback position
│     ├── episodeId: string
│     ├── position:  number (seconds)
│     ├── duration:  number
│     ├── updatedAt: number (unix ms)
│     └── completedAt: number | null
│
└── history/{episodeId}            Listening history entry
      ├── episodeId:    string
      ├── episodeTitle: string
      ├── podcastTitle: string
      ├── imageUrl:     string
      ├── position:     number
      ├── duration:     number
      ├── lastPlayedAt: number (unix ms)
      └── completed:    boolean
```

### Security Rules

Firestore rules (`firestore.rules`) enforce:
- Read/write only for the authenticated owner (`request.auth.uid == userId`)
- No cross-user access

### Firebase Services Used

| Service | Usage |
|---------|-------|
| Firebase Auth | Google OAuth, session persistence |
| Firestore | subscriptions, playback progress, history |
| Firebase Hosting | Production + staging + preview channels |
| Firebase Analytics | Screen tracking (production only) |

### Emulators (E2E)

- **Auth emulator:** `localhost:9099`
- **Firestore emulator:** `localhost:8080`
- Activated via `environment.useEmulators = true`

---

## 12. External API Integration

### iTunes Search API

**Base URL:** `https://itunes.apple.com`  
**Authentication:** None required (public)

| Endpoint | Usage |
|----------|-------|
| `/search?term={q}&country={cc}&media=podcast&limit=50` | Podcast search |
| `/lookup?id={itunesId}&media=podcast&entity=podcastEpisode&limit=50` | Podcast + episodes |
| `https://rss.applemarketingtools.com/api/v2/{cc}/podcasts/top/{n}/podcasts.json` | Trending podcasts |

**Country Detection:**

```typescript
detectCountry(): string {
  const lang = navigator.language || 'en';
  const map = { 'en': 'us', 'es': 'es', 'fr': 'fr', 'de': 'de', ... };
  return map[lang.split('-')[0]] ?? 'us';
}
```

**Model Mapping:** iTunes raw objects → `Podcast` / `Episode` domain models inside service (consumers never see raw iTunes types).

---

## 13. Audio Playback Architecture

### HTMLAudioElement Lifecycle

```
PodcastDetailPage.playEpisode(episode)
  ↓ playerStore.play(episode)
  ↓ AudioService.effect() fires (currentEpisode() changed)
  ↓ audio.src = episode.audioUrl
  ↓ progressSync.loadProgress(episodeId, uid)  [async]
  ↓ audio.play()
  ↓ loadedmetadata → apply pending restore position
  ↓ timeupdate → playerStore.updateProgress() + scheduleWrite()
  ↓ ended → playerStore.playNext() + historySyncService.recordPlay()
```

### Progress Persistence

- **Write throttle:** max 1 write per 5 seconds during playback
- **Flush triggers:** pause, episode change, app unload
- **Minimum position:** ≥ 2 seconds (ignores accidental starts)
- **Completion:** sets `completedAt` timestamp; position NOT restored on re-open
- **Merge writes:** `{ merge: true }` — safe for concurrent device access

### Media Session API

```typescript
navigator.mediaSession.metadata = new MediaMetadata({
  title, artist, artwork: [{ src: imageUrl }]
});
// Handlers: play, pause, stop, seekforward, seekbackward, seekto,
//           previoustrack, nexttrack
```

---

## 14. Angular Patterns

### Dependency Injection — always `inject()`

```typescript
// ✅ Correct
export class HomePage {
  private readonly api = inject(PodcastApiService);
  protected readonly store = inject(PodcastsStore);
}
// ❌ Never constructor injection
```

### Signals — all state reads

```typescript
const count = signal(0);
count();          // read
count.set(1);     // write
count.update(n => n + 1);  // update
computed(() => count() * 2);  // derived
effect(() => { console.log(count()); });  // side effect
```

### NgRx SignalStore

```typescript
export const PodcastsStore = signalStore(
  { providedIn: 'root' },
  withState<PodcastsState>(initialState),
  withComputed((store) => ({
    hasResults: computed(() => store.searchResults().length > 0),
  })),
  withMethods((store) => ({
    setResults(results: Podcast[]): void {
      patchState(store, { searchResults: results });
    },
  })),
);
```

### Component Anatomy

```typescript
@Component({
  selector: 'wavely-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonButton, RouterLink, ...],
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  protected readonly store = inject(SomeStore);
  readonly someOutput = output<string>();
  @Input({ required: true }) someInput!: string;
}
```

### RxJS — search debounce pattern

```typescript
this.searchSubject.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.api.searchPodcasts(term, this.country)),
  takeUntilDestroyed(),
).subscribe(results => this.store.setSearchResults(results, term));
```

### SSR Safety

```typescript
constructor() {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    // browser-only code (window, document, audio)
  }
}
```

---

## 15. Environment Configuration

| File | Used when |
|------|-----------|
| `environment.ts` | Local dev |
| `environment.prod.ts` | Production build |
| `environment.staging.ts` | Staging build |
| `environment.e2e.ts` | Playwright E2E |

```typescript
interface Environment {
  production:    boolean;
  appVersion:    string;          // e.g., "1.1.0"
  useEmulators:  boolean;
  sentryDsn:     string;          // empty → Sentry no-op
  firebase:      FirebaseOptions; // from NG_APP_FIREBASE_* env vars
}
```

**Environment injection:** `scripts/generate-env.mjs` reads process env vars and writes `environment.prod.ts` at build time. Nx `fileReplacements` selects the correct file per build configuration.

---

## 16. Testing Strategy

### Unit Tests

- **Runner:** Jest (via Nx)
- **Files:** `*.spec.ts` alongside source files
- **Coverage target:** 80%
- **Run:** `bun run test`
- **Current state:** 213 tests passing, 26 suites ✅

Key tested units:
- All stores (PlayerStore, AuthStore, PodcastsStore, HistoryStore)
- All services (AudioService, PodcastApiService, ProgressSyncService, etc.)
- Auth guard
- All feature pages (shallow render)
- All shared components

### E2E Tests

- **Runner:** Playwright (Chromium)
- **Location:** `e2e/src/`
- **Auth:** Custom Firebase token → `/e2e-auth/:token` (emulator)
- **Requires:** Firebase emulators running (`firebase emulators:start`)
- **Run:** `bun nx run wavely:e2e`

Key E2E flows:
- Login / logout
- Podcast search
- Subscribe / unsubscribe
- Play episode, progress persistence
- Library contents after history
- Offline banner behavior

### CI Gates

| PR target | Required checks |
|-----------|-----------------|
| `dev` | Unit tests |
| `staging` | Unit tests + E2E |
| `main` | Unit tests + E2E + Lighthouse CI |

---

## 17. CI/CD Pipeline

### Branch Strategy

```
feature/* (individual work)
    ↓ PR
dev (integration, staging preview deploy)
    ↓ PR
staging (full E2E gate, staging.web.app)
    ↓ PR
main (Lighthouse gate, production deploy, semantic-release)
```

**Rules:**
- Never commit directly to `main` or `staging`
- Feature branches from `dev`
- Hotfixes from `main`, backport to `dev`
- Conventional Commits: `feat(scope): desc`, `fix(scope): desc`, `chore(scope): desc`

### GitHub Actions Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `firebase-hosting-preview.yml` | PR opened/updated | Build + deploy preview channel |
| `firebase-hosting-staging.yml` | Push to `dev` | Unit tests + deploy staging |
| `e2e.yml` | PR → `staging` or `main` | Firebase emulators + Playwright |
| `firebase-hosting.yml` | Push to `main` | Build + unit tests + deploy prod + semantic-release |
| `pages.yml` | Push to `main` (docs/**) | Deploy GitHub Pages landing |

### Squash-Merge Divergence

When promoting dev → staging (squash merge), staging accumulates unique squash commits.  
Next promotion must use the **reconcile approach**:

```bash
git checkout -b sync/promote-X origin/staging
git checkout origin/dev -- .
git commit -m "chore: reconcile staging with dev"
# Open PR to staging → CLEAN (no conflict)
```

---

## 18. Deployment

### Production

- **URL:** https://wavely-f659c.web.app  
- **Trigger:** Merge to `main`  
- **Artifacts:** Angular SSR build → `dist/wavely/browser/` + Express server  
- **Post-deploy:** `cp dist/wavely/browser/index.csr.html dist/wavely/browser/index.html` (SSR build quirk)

### Staging

- **URL:** https://wavely-f659c--staging.web.app  
- **Trigger:** Push to `dev`

### Preview Channels

- **Trigger:** Any PR  
- **URL format:** `https://wavely-f659c--pr-{N}-{hash}.web.app`  
- **Expiry:** 7 days

### Capacitor (Native)

```bash
bun run cap:build   # nx build + copy index + cap copy + cap sync
```

---

## 19. Shipped — Discovery & Library (v1.2.0) ✅

**Released:** v1.2.0 | **GitHub issues:** [#38](https://github.com/bndF1/wavely/issues/38), [#39](https://github.com/bndF1/wavely/issues/39), [#40](https://github.com/bndF1/wavely/issues/40)

### Issue #38 — Search: Recent Searches ✅

- `SearchHistoryService` persists last 8 queries in `localStorage`
- Search page shows recent chips when input is focused and empty
- Tapping a chip fills and submits the search

### Issue #39 — Library: Episode Filtering ✅

- Filter chips: All | Unplayed | In Progress
- `HistoryStore` extended with `activeFilter` signal + `filteredEntries` computed
- `markPlayed` / `markUnplayed` actions sync to Firestore via `HistorySyncService`

### Issue #40 — Browse: Category Detail Pages ✅

- Route `/browse/category/:genreId` → `CategoryDetailPage`
- Category chip click navigates to detail page with top 50 podcasts for that genre
- SSR render mode set to `RenderMode.Client` for parameterized route

---

## 20. Next Milestone — Native Platform (v1.3.0)

**GitHub issues:** [#41](https://github.com/bndF1/wavely/issues/41), [#42](https://github.com/bndF1/wavely/issues/42), [#43](https://github.com/bndF1/wavely/issues/43), [#44](https://github.com/bndF1/wavely/issues/44)

| Issue | Title |
|-------|-------|
| #41 | Push notifications (FCM) |
| #42 | Deep links / Universal Links |
| #43 | App Store + Play Store submission |
| #44 | Native share sheet |

---

## 20. Known Limitations & Tech Debt

| Item | Severity | Notes |
|------|----------|-------|
| No wildcard 404 route | Low | Firebase Hosting handles 404 fallback via `firebase.json` rewrites |
| iTunes API only | Medium | No Podcast Index fallback; Apple can rate-limit or change structure |
| Episode descriptions are HTML strings | Low | No sanitization pipe — rendered as text, XSS risk if rendered as HTML |
| `podcastTitle` added dynamically to `Episode` | Low | Type-unsafe workaround; should be included in `Episode` model |
| SSR Express serves all routes | Low | `server.ts` uses wildcard express route; needs review for performance |
| Capacitor sync not automated in CI | Medium | Capacitor sync must be run manually before native builds |
| No offline episode downloads | Planned | v2.0.0 milestone |
| No push notifications | Planned | v1.2.0 milestone |
| No sleep timer | Planned | v2.0.0 milestone |
| Progress restoration race condition | Low | `AudioService.pendingRestorePosition` handles it; a signal-based approach would be cleaner |
