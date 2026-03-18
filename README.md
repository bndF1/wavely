# 🎙 Wavely

> A beautiful, open-source podcast player for **iOS**, **Android**, and the **Web**.  
> Inspired by Google Podcasts. Built with Angular 21, Ionic 8, and Capacitor 8.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.io)
[![Ionic](https://img.shields.io/badge/Ionic-8-blue?logo=ionic)](https://ionicframework.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-green?logo=capacitor)](https://capacitorjs.com)
[![Status](https://img.shields.io/badge/status-beta-blue)](https://wavely-f659c.web.app)
[![Release](https://img.shields.io/github/v/release/bndF1/wavely)](https://github.com/bndF1/wavely/releases)

> 🚀 **Public Beta** — Core features are stable. Active development continues — see [milestones](https://github.com/bndF1/wavely/milestones) for what's coming.

## 🌐 Live Environments

| Environment | URL | Notes |
|-------------|-----|-------|
| 🏠 **Landing Page** | [bndf1.github.io/wavely](https://bndf1.github.io/wavely/) | GitHub Pages |
| 🚀 **Production** | [wavely-f659c.web.app](https://wavely-f659c.web.app) | Stable releases (tagged) |
| 🧪 **Staging** | See [GitHub Deployments](https://github.com/bndF1/wavely/deployments/staging) | Pre-release validation |
| 🔧 **Dev** | See [GitHub Deployments](https://github.com/bndF1/wavely/deployments/dev) | Latest integration |

Every PR also gets an ephemeral preview channel: `https://wavely-f659c--pr-<number>-<hash>.web.app` (expires in 7 days).

> **Note on dev/staging URLs**: Firebase preview channel URLs include a stable random hash (e.g. `wavely-f659c--dev-xxxxxxxx.web.app`). The hash is assigned when the channel is first created and stays the same as long as the channel doesn't expire. Find the current URL in [GitHub Deployments](https://github.com/bndF1/wavely/deployments) or the latest workflow run's job summary. A weekly cron prevents channels from expiring.

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 🔊 **Audio Player** | ✅ | Full-screen player with scrubber, speed control (0.5×–2×), skip ±30s, mini-player |
| 🔑 **Firebase Auth** | ✅ | Google Sign-In + email/password; syncs data across devices |
| 📱 **Cross-Platform** | ✅ | iOS + Android (Capacitor) + Web (PWA) from a single codebase |
| 🌙 **Dark Mode** | ✅ | System-aware with manual override, persisted to localStorage |
| 📡 **PWA / Offline** | ✅ | Angular service worker — app shell, artwork cached 7 days |
| 🔍 **Search & Browse** | ✅ | Real-time debounced search, browse by category, country-aware trending |
| 📚 **Library** | ✅ | Subscribe/unsubscribe with Firestore sync |
| 🗃 **State Management** | ✅ | NgRx SignalStore for player (+ queue), podcasts, auth, and history |
| 📻 **Internet Radio** | ✅ | Browse and play radio stations by category and country (Radio Browser API) |
| 🕓 **Listening History** | ✅ | Episode history with progress tracking, synced to Firestore, filterable |
| 📋 **Queue / Up Next** | ✅ | Add to queue, Play Next, reorder/remove, auto-queue from episode feed |
| 🏠 **Episode Feed** | ✅ | Latest episodes from subscriptions on Home tab, date-sorted with load more |
| 🌍 **Country-aware Content** | ✅ | iTunes market selection, localized trending podcasts per country |
| 👤 **Publisher Profiles** | ✅ | Browse all shows from a podcast's author/publisher |

---

## 🚀 Quick Start

**Prerequisites:** [Bun](https://bun.sh) v1.3+ · [Node.js](https://nodejs.org) 20+

```bash
# 1. Clone
git clone https://github.com/bndF1/wavely.git
cd wavely

# 2. Install
bun install

# 3. Set up environment (copy and fill in Firebase config)
cp .env.example .env

# 4. Dev server (web)
bun start
# → http://localhost:4200
```

---

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `bun start` | Dev server at `localhost:4200` |
| `bun run build` | Production build (SSR + service worker) |
| `bun test` | Unit tests (Jest) |
| `bun run cap:build` | Production build + sync to native platforms |
| `bun run cap:sync` | Sync latest web build to iOS and Android |
| `bun run cap:ios` | Sync + open Xcode |
| `bun run cap:android` | Sync + open Android Studio |
| `bun run cap:serve` | Live-reload dev on iOS simulator |

---

## 🏗 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular (standalone) | 21.2.x |
| Mobile shell | Ionic | 8.8.x |
| Native runtime | Capacitor | 8.2.x |
| State | NgRx SignalStore | 21.0.x |
| Backend / Auth | Firebase + AngularFire | 12.x / 20.x |
| Podcast data | iTunes Search API | — |
| Workspace | Nx | 22.5.x |
| Package manager | Bun | 1.3.x |
| Unit tests | Jest | 30.x |
| E2E tests | Playwright | 1.36.x |
| CI/CD | GitHub Actions + Firebase Hosting | — |

---

## 📁 Project Structure

```
wavely/
├── src/
│   └── app/
│       ├── core/                 # Services, guards, interceptors, models
│       │   └── services/
│       │       ├── audio.service.ts             # HTMLMediaElement wrapper + Media Session
│       │       ├── podcast-api.service.ts       # iTunes Search API client
│       │       ├── radio-api.service.ts         # Radio Browser API client
│       │       ├── auth.service.ts              # Firebase Auth wrapper
│       │       ├── subscription-sync.service.ts # Firestore ↔ store sync
│       │       ├── history-sync.service.ts      # Listening history Firestore sync
│       │       ├── search-history.service.ts    # Local search history
│       │       └── progress-sync.service.ts     # Playback progress sync
│       ├── features/             # Lazy-loaded pages
│       │   ├── home/             # Subscriptions feed + episode feed
│       │   ├── browse/           # Categories + trending + radio
│       │   ├── search/           # Real-time search + history
│       │   ├── library/          # Subscribed podcasts + history
│       │   ├── podcast-detail/   # Episode list + subscribe
│       │   ├── publisher/        # All shows from a publisher
│       │   └── episode-detail/   # Player + description
│       ├── store/                # NgRx SignalStores
│       │   ├── auth/             # AuthStore — user session
│       │   ├── player/           # PlayerStore — playback state + queue
│       │   ├── history/          # HistoryStore — listening history
│       │   └── podcasts/         # PodcastsStore — subscriptions, search
│       └── shared/               # Reusable components, pipes, directives
├── e2e/                          # Playwright E2E tests + Firebase emulator setup
├── android/                      # Capacitor Android (Gradle)
├── ios/                          # Capacitor iOS (Xcode / Swift)
├── docs/                         # Landing page (GitHub Pages)
├── scripts/
│   └── generate-env.mjs          # Injects secrets into environment files at build time
├── .github/
│   └── workflows/
│       ├── firebase-hosting.yml          # Deploy to production (push to main)
│       ├── firebase-hosting-staging.yml  # Deploy to staging (push to staging)
│       ├── firebase-hosting-preview.yml  # Preview channel per PR
│       └── e2e.yml                       # Playwright E2E (required gate for staging/main)
├── ngsw-config.json              # Service worker caching rules
├── capacitor.config.ts           # Capacitor configuration
└── project.json                  # Nx build targets
```

---

## 📱 Native Platforms

### iOS

Requires **Xcode** installed on macOS.

```bash
bun run cap:ios         # build + sync + open Xcode
# → Archive and submit via Xcode Organizer
```

### Android

Requires **Android Studio** installed.

```bash
bun run cap:android     # build + sync + open Android Studio
# → Build APK/AAB via Gradle
```

### Live-Reload on Device

```bash
bun run cap:serve       # starts Angular dev server + runs on iOS simulator
```

---

## 🧪 Testing

```bash
# Unit tests
bun test
bunx nx test --watch
bunx nx test --coverage

# E2E (Playwright — requires Firebase emulators running)
bunx nx e2e
```

E2E tests use Firebase Auth + Firestore emulators and a dedicated `e2e` build configuration with `useEmulators: true`.

---

## 🔄 CI / CD Pipeline

| Trigger | Checks | Deploy |
|---------|--------|--------|
| PR opened | Unit tests + preview channel | `wavely-f659c--pr-<n>-<hash>.web.app` |
| Push to `staging` | Unit tests | Firebase staging channel (URL in [GitHub Deployments](https://github.com/bndF1/wavely/deployments/staging)) |
| PR to `staging` | Unit tests + **E2E** | — |
| PR to `main` | Unit tests + **E2E** + **Lighthouse CI** | — |
| Push to `main` | Unit tests + build + semantic-release | `wavely-f659c.web.app` (production) |

Secrets are injected at build time via `scripts/generate-env.mjs` — **no credentials are committed to the repository**.

---

## 🤝 Contributing

This project follows a strict git flow: `feature/*` → `dev` → `staging` → `main`.

```bash
# Start a feature
git checkout dev && git pull origin dev
git checkout -b feature/my-feature

# Code, then commit using Conventional Commits
git commit -m "feat(player): add sleep timer"

# Push and open a PR → dev
gh pr create --base dev
```

**Angular patterns to follow:**
- Standalone components with `OnPush` change detection
- `inject()` for dependency injection (no constructor injection)
- Signal inputs/outputs (`input()` / `output()`)
- `signal<T>()` for local state, `computed()` for derived state
- `takeUntilDestroyed(DestroyRef)` for subscriptions

---

## 🗺 Roadmap

### v0.5.0 — Security & Stability ✅ Shipped
- [x] Firestore security rules
- [x] Firebase Authentication (Google Sign-In + email/password)
- [x] Comprehensive E2E test suite (Playwright + emulators)
- [x] Unit test coverage ≥ 80%

### v1.0.0 — Foundation ✅ Shipped
- [x] Audio player, dark mode, PWA, cross-platform (iOS/Android/Web)
- [x] iTunes search, browse by category, library with Firestore sync

### v1.1.0 — MVP Complete ✅ Shipped
- [x] Up Next queue with auto-advance and persistence ([#34](https://github.com/bndF1/wavely/issues/34))
- [x] Listening history with progress tracking ([#28](https://github.com/bndF1/wavely/issues/28))
- [x] Background audio & lockscreen controls ([#35](https://github.com/bndF1/wavely/issues/35))
- [x] Error states, offline handling, empty state illustrations ([#36](https://github.com/bndF1/wavely/issues/36))
- [x] Lighthouse CI for performance and accessibility ([#37](https://github.com/bndF1/wavely/issues/37))

### v1.2.0 — Discovery & Library ✅ Shipped
- [x] Search history and quick suggestions ([#38](https://github.com/bndF1/wavely/issues/38))
- [x] Episode filtering (unplayed / in-progress) ([#39](https://github.com/bndF1/wavely/issues/39))
- [x] Browse: category detail pages, featured section ([#40](https://github.com/bndF1/wavely/issues/40))

### v1.3.0–v1.3.5 — Stability & Bugfixes ✅ Shipped
- [x] Country-aware trending podcasts and iTunes market selection
- [x] Publisher profiles (browse all shows from an author)
- [x] Firebase Auth fixes across all environments

### v1.4.0–v1.4.2 — Radio, History UX & Queue ✅ Shipped
- [x] Internet radio via Radio Browser API (browse by category and country)
- [x] Listening history UX improvements (filterable, synced to Firestore)
- [x] Queue / Up Next UX overhaul and episode feed on Home tab

### v1.5.0 — Navigation Restructure ✅ Shipped
- [x] Discover tab: unified Search + Browse hub
- [x] Radio as a dedicated hub tab

### v1.5.1 — Light Theme Fix ✅ Shipped
- [x] Light mode broken when OS was in dark mode
- [x] Theme service hardening (SSR safety, localStorage validation)

### v1.5.2 — UX Quick Wins ✅ Shipped
- [x] Trending section first in Discover tab
- [x] Radio station limit raised to 100 results
- [x] Search page removed from Discover (consolidated into the tab's own search bar)
- [x] Logout now stops the audio player
- [x] Onboarding UX: Home shows trending when no subscriptions

### v1.5.3–v1.5.11 — Polish & Incremental Fixes ✅ Shipped
- [x] Multiple layout, padding and spacing fixes across tabs
- [x] Feed list left padding restored
- [x] Version bump automation and CI hardening

### v1.6.0 — Design Tokens, WCAG Touch Targets & Completed Episode Filter ✅ Shipped
- [x] Episode-item transparent background — removes white card background from feed list ([#291](https://github.com/bndF1/wavely/issues/291) partial)
- [x] Design token cleanup — replaced hardcoded `#fff` with `var(--ion-color-primary-contrast)` in browse, discover, and radio chip selected states
- [x] Full-player LIVE badge now uses `var(--ion-color-danger)` / `var(--ion-color-danger-contrast)` instead of hardcoded hex values
- [x] Mini-player play/close buttons bumped from 40 px → 44 px for WCAG 2.5.5 touch target compliance ([#290](https://github.com/bndF1/wavely/issues/290) partial)
- [x] Home feed filters out completed episodes via HistoryStore ([#242](https://github.com/bndF1/wavely/issues/242))

### v1.7.0 — Settings, Dark Mode & i18n ✅ Shipped
- [x] Settings page with dark mode toggle and language picker (English, Spanish, French, German, Portuguese)
- [x] @ngx-translate/core v17 integration with signal-based LanguageService
- [x] WCAG contrast improvements (primary #4A9EFF, danger #F28B82 in dark mode)
- [x] All templates translated with translate pipe

### v1.8.0 — Favorite Radio Stations on Home Screen ✅ Shipped
- [x] Favorite stations horizontal scroll section on Home page
- [x] UserPreferencesService stores full RadioStation objects (name, favicon, url)
- [x] Firebase sync for favorite stations across devices

### v1.8.1 — Catalan Language Support ✅ Shipped
- [x] Catalan (ca) language added to the language picker

### v1.8.2 — Desktop UI Polish & E2E Hardening ✅ Shipped
- [x] Desktop layout consistency pass (Discover, Radio, Library spacing/padding)
- [x] Sidebar navigation for desktop (≥1024 px) with hidden tab bar
- [x] Radio favorites section hidden while in search mode ([#c89ebfe](https://github.com/bndF1/wavely/commit/c89ebfe))
- [x] E2E subscription test hardened (word-boundary regex, viewport-safe clicks)

### v2.0 — Native Platform
- [ ] Push notifications ([#41](https://github.com/bndF1/wavely/issues/41))
- [ ] Deep links / Universal Links ([#42](https://github.com/bndF1/wavely/issues/42))
- [ ] App Store + Play Store submission ([#43](https://github.com/bndF1/wavely/issues/43))

### v3.0 — Advanced Features
- [ ] Sleep timer ([#45](https://github.com/bndF1/wavely/issues/45))
- [ ] Chapter support ([#46](https://github.com/bndF1/wavely/issues/46))
- [ ] Offline downloads ([#48](https://github.com/bndF1/wavely/issues/48))

---

## 📄 License

[MIT](LICENSE) © 2026 Wavely contributors
