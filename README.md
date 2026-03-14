# 🎙 Wavely

> A beautiful, open-source podcast player for **iOS**, **Android**, and the **Web**.  
> Inspired by Google Podcasts. Built with Angular 21, Ionic 8, and Capacitor 8.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.io)
[![Ionic](https://img.shields.io/badge/Ionic-8-blue?logo=ionic)](https://ionicframework.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-green?logo=capacitor)](https://capacitorjs.com)
[![Status](https://img.shields.io/badge/status-alpha-orange)](https://wavely-f659c.web.app)

> ⚠️ **Early Alpha** — The app is live but pre-MVP. Expect rough edges and frequent changes.

## 🌐 Live Environments

| Environment | URL | Notes |
|-------------|-----|-------|
| 🏠 **Landing Page** | [bndf1.github.io/wavely](https://bndf1.github.io/wavely/) | GitHub Pages |
| 🚀 **Production** | [wavely-f659c.web.app](https://wavely-f659c.web.app) | Stable releases |
| 🧪 **Staging** | [wavely-f659c--staging.web.app](https://wavely-f659c--staging.web.app) | Pre-release validation |
| 🔧 **Dev** | [wavely-f659c--dev.web.app](https://wavely-f659c--dev.web.app) | Latest integration |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔊 **Audio Player** | Full-screen player with scrubber, speed control (0.5×–2×), skip ±30s, and mini-player |
| 📱 **Cross-Platform** | iOS + Android (Capacitor) + Web (PWA) from a single codebase |
| 🌙 **Dark Mode** | System-aware with manual override, persisted to localStorage |
| 📡 **Offline / PWA** | Angular service worker — app shell, artwork (7d), iTunes API cache (1h) |
| 🔍 **Search & Browse** | Real-time debounced search, browse by category, trending podcasts |
| 📚 **Podcast Detail** | Episode list, subscribe/unsubscribe, share |
| 🎧 **Episode Detail** | Full description, progress scrubber, playback controls |
| 🗃 **State Management** | NgRx SignalStore for player and podcast data |

---

## 🚀 Quick Start

**Prerequisites:** [Bun](https://bun.sh) v1.3+ · [Node.js](https://nodejs.org) 20+

```bash
# 1. Clone
git clone https://github.com/bndF1/wavely.git
cd wavely

# 2. Install
bun install

# 3. Dev server (web)
bun start
# → http://localhost:4200
```

---

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `bun start` | Dev server at `localhost:4200` |
| `bun run build` | Production build (SSR) |
| `bun test` | Unit tests with Jest |
| `bun run cap:sync` | Build + sync to iOS and Android |
| `bun run cap:ios` | Sync + open Xcode |
| `bun run cap:android` | Sync + open Android Studio |
| `bun run cap:serve` | Live-reload dev on iOS simulator (`CAP_ENV=local`) |

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
| Testing | Jest + Playwright | 30.x / 1.36.x |
| CI | GitHub Actions | — |

---

## 📁 Project Structure

```
wavely/
├── src/
│   └── app/
│       ├── core/                 # Services, models, guards, interceptors
│       │   ├── services/
│       │   │   ├── podcast-api.service.ts   # iTunes Search API client
│       │   │   └── theme.service.ts         # Dark/light mode
│       │   └── models/
│       ├── features/             # Lazy-loaded pages
│       │   ├── home/             # Subscriptions feed + trending
│       │   ├── browse/           # Categories + trending
│       │   ├── search/           # Real-time search
│       │   ├── library/          # Subscriptions + history
│       │   ├── podcast-detail/   # Episode list + subscribe
│       │   └── episode-detail/   # Player + description
│       ├── store/                # NgRx SignalStores
│       │   ├── player/           # PlayerStore — playback state
│       │   └── podcasts/         # PodcastsStore — subscriptions, search
│       └── shared/               # Reusable components, pipes, directives
├── android/                      # Capacitor Android (Gradle)
├── ios/                          # Capacitor iOS (Xcode / Swift)
├── docs/                         # Landing page (GitHub Pages)
├── .github/
│   └── workflows/
│       ├── ci.yml                # Build, lint, test, type-check
│       └── pages.yml             # Deploy docs/ to GitHub Pages
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

## 🔥 Firebase Auth (Optional)

Issue #8. Requires a Firebase project. Once you have credentials:

1. Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey:            'YOUR_API_KEY',
    authDomain:        'YOUR_PROJECT.firebaseapp.com',
    projectId:         'YOUR_PROJECT',
    storageBucket:     'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId:             'YOUR_APP_ID',
  }
};
```

2. Open an issue or PR — the Firebase Auth integration is [tracked in #8](https://github.com/bndF1/wavely/issues/8).

---

## 🧪 Testing

```bash
bun test                          # all unit tests
bunx nx test --watch              # watch mode
bunx nx test --coverage           # with coverage report
# E2E (Playwright) — target not yet configured in project.json
# bunx nx e2e
```

---

## 🔄 CI Pipeline

Every push to `main` / `develop` and every PR runs:

1. **Type check** — `tsc --noEmit`
2. **Lint** — ESLint + angular-eslint
3. **Build** — Nx production build (SSR + service worker)
4. **Tests** — Jest with coverage
5. Coverage artifact uploaded on PRs

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes following the Angular patterns in this codebase:
   - Standalone components with `OnPush` change detection
   - `inject()` for dependency injection (no constructor injection)
   - Signal inputs/outputs (`input()` / `output()`)
   - `signal<T>()` for local state, `computed()` for derived state
   - `takeUntilDestroyed(DestroyRef)` for subscriptions
4. Commit: `git commit -m "feat: description"`
5. Push and open a PR against `main`

---

## 🗺 Roadmap

- [x] Tab navigation shell
- [x] Home page (subscriptions + trending)
- [x] Search + Browse pages
- [x] Library page
- [x] Podcast Detail page
- [x] Episode Detail page + player controls
- [x] Dark mode (signal-based ThemeService)
- [x] PWA / Offline support (Angular service worker)
- [x] CI pipeline (GitHub Actions)
- [x] Native platforms (iOS + Android via Capacitor)
- [ ] Firebase Authentication (Google Sign-In + email) — [#8](https://github.com/bndF1/wavely/issues/8)
- [ ] Download episodes (Capacitor Filesystem)
- [ ] Push notifications (Capacitor Push + Firebase)
- [ ] Background audio (Media Session API + Capacitor Media)

---

## 📄 License

[MIT](LICENSE) © 2026 Wavely contributors
