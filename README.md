# 🎙 Wavely

> A beautiful, open-source podcast player for **iOS**, **Android**, and the **Web**.  
> Inspired by Google Podcasts. Built with Angular 21, Ionic 8, and Capacitor 8.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.io)
[![Ionic](https://img.shields.io/badge/Ionic-8-blue?logo=ionic)](https://ionicframework.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-green?logo=capacitor)](https://capacitorjs.com)
[![Status](https://img.shields.io/badge/status-alpha-orange)](https://wavely-f659c.web.app)
[![Release](https://img.shields.io/github/v/release/bndF1/wavely)](https://github.com/bndF1/wavely/releases)

> ⚠️ **Early Alpha** — The app is live but pre-MVP. Expect rough edges and frequent changes.

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
| 🔍 **Search & Browse** | ✅ | Real-time debounced search, browse by category, trending podcasts |
| 📚 **Library** | ✅ | Subscribe/unsubscribe with Firestore sync |
| 🗃 **State Management** | ✅ | NgRx SignalStore for player, podcasts, and auth |

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
│       │       ├── audio.service.ts             # HTMLMediaElement wrapper
│       │       ├── podcast-api.service.ts       # iTunes Search API client
│       │       ├── auth.service.ts              # Firebase Auth wrapper
│       │       ├── subscription-sync.service.ts # Firestore ↔ store sync
│       │       └── progress-sync.service.ts     # Playback progress sync
│       ├── features/             # Lazy-loaded pages
│       │   ├── home/             # Subscriptions feed + trending
│       │   ├── browse/           # Categories + trending
│       │   ├── search/           # Real-time search
│       │   ├── library/          # Subscribed podcasts
│       │   ├── podcast-detail/   # Episode list + subscribe
│       │   └── episode-detail/   # Player + description
│       ├── store/                # NgRx SignalStores
│       │   ├── auth/             # AuthStore — user session
│       │   ├── player/           # PlayerStore — playback state
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

### v1.0.0 — MVP (in progress)
- [ ] Background audio & lockscreen controls ([#35](https://github.com/bndF1/wavely/issues/35))
- [ ] Up Next queue ([#34](https://github.com/bndF1/wavely/issues/34))
- [ ] Listening history ([#28](https://github.com/bndF1/wavely/issues/28))
- [ ] Error states & offline handling ([#36](https://github.com/bndF1/wavely/issues/36))
- [ ] Lighthouse CI ([#37](https://github.com/bndF1/wavely/issues/37))

### v1.1.0 — Discovery & Library
- [ ] Search history ([#38](https://github.com/bndF1/wavely/issues/38))
- [ ] Episode filtering ([#39](https://github.com/bndF1/wavely/issues/39))
- [ ] Browse improvements ([#40](https://github.com/bndF1/wavely/issues/40))

### v1.2.0 — Native Platform
- [ ] Push notifications ([#41](https://github.com/bndF1/wavely/issues/41))
- [ ] Deep links / Universal Links ([#42](https://github.com/bndF1/wavely/issues/42))
- [ ] App Store + Play Store submission ([#43](https://github.com/bndF1/wavely/issues/43))

---

## 📄 License

[MIT](LICENSE) © 2026 Wavely contributors
