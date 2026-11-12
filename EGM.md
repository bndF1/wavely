# Wavely Blueprint

## System Overview

Wavely is an open-source podcast and internet-radio player for iOS, Android and the
Web, built with Angular 21, Ionic 8 and Capacitor 8 (see [README.md](./README.md)
for product details and [SDD.md](./SDD.md) for the design document). It is one Nx
workspace with two projects: `wavely` (the app, `project.json`) and `e2e`
(Playwright, `e2e/project.json`). It uses bun as the package manager.

```
Browser / Capacitor WebView
  └─ src/app ── features (views) ─┬─> store (NgRx signal stores, in-memory state)
                                  └─> core/services ─┬─> Firebase Auth / Firestore users/{uid}/*
                                                     ├─> iTunes Search API, RSS feeds (corsproxy.io fallback)
                                                     ├─> Radio Browser API
                                                     └─> localStorage, HTMLAudioElement, Media Session
```

The web build is hosted on Firebase Hosting (`firebase.json`: `dist/wavely/browser`, SPA
rewrite). Native shells come from `cap sync`, which copies that build into `android/`
and `ios/`. The `@capacitor/*` plugins (App, Haptics, Keyboard, PushNotifications,
SplashScreen, StatusBar) are installed and configured in `capacitor.config.ts`, but no
file in `src` imports them yet.

## Local Interface & Invariants

The root holds configuration only, with no application source:

- `capacitor.config.ts`: Capacitor app config. Its `appId` must match the Android package `io.wavely.app`.
- `firestore.rules`: security rules for `users/{uid}/{subscriptions,progress,queue,favoriteStations,tokens,history}`, `podcasts/{podcastId}` and `episodes/{episodeId}`, with a catch-all `/{document=**}` match. Client code uses only `subscriptions`, `progress`, `favoriteStations` and `history`. The other rules have no client code yet.
- `firebase.json`: hosting, the Firestore rules path, and the emulator ports (Auth 9099, Firestore 8080).
- `package.json` scripts: `generate-env`, `start`, `build`, `test`, `cap:build`, `cap:sync`, `cap:ios`, `cap:android`, `cap:serve`.
- `jest.config.cts`, `jest.preset.js`, `eslint.config.mjs`, `tsconfig*.json`, `nx.json`, `ngsw-config.json`, `.lighthouserc.json`: tooling config. The service worker is built only in the `production` configuration. `src/ngsw-config.json` is an unused duplicate of the root file.

## Subdirectories & System Boundaries

- src: [./src/EGM.md](./src/EGM.md). The Angular app: browser and SSR entry points, the Express SSR server, `app/` (core, store, features, shared) and `environments/`.
- e2e: [./e2e/EGM.md](./e2e/EGM.md). The Playwright project `e2e`. Its global setup creates an Auth Emulator user, signs in through `/e2e-auth/:token` and saves storage state to `e2e/.auth/user.json`.
- scripts: [./scripts/EGM.md](./scripts/EGM.md). `generate-env.mjs` writes the gitignored `src/environments/environment*.ts` from `NG_APP_*` variables. `firebase-add-auth-domain.mjs` adds preview domains to the Firebase Auth authorized domains.
- android: [./android/EGM.md](./android/EGM.md). The Capacitor Android Gradle project. Its only hand-written source is `MainActivity`.
- ios: [./ios/EGM.md](./ios/EGM.md). The Capacitor Xcode project: `AppDelegate` and the CapApp-SPM package.
- `docs/`, `public/`: no source code. `docs/` is the GitHub Pages landing page. `public/` holds static assets: the `i18n/*.json` translations for ca, de, en, es, fr and pt, plus the icons and default artwork.

## Global Invariants

- **Secrets are never committed.**
  - `src/environments/environment{,.prod,.staging}.ts`, `.env`, `.mcp.json` and `e2e/.auth/user.json` are gitignored.
  - Credentials enter only through `NG_APP_*` variables at build time. `scripts/generate-env.mjs` writes them as literal values into the gitignored environment files. (`src/app/core/services/firebase.config.ts` reads `import.meta.env`, but nothing imports it.)
- `environment.useEmulators` is the single switch for the E2E-only surface. It gates the emulator connections, the `e2e-auth/:token` route and the `window.__e2e*` hooks. It is true only in `environment.e2e.ts`.
- Per-user data lives under Firestore `users/{uid}/…` and is written by the `*-sync` services in `src/app/core/services`. The one exception is the emulator-only probe in `src/app/app.ts`, which writes and deletes `users/{uid}/subscriptions/__e2e_probe`. Every new collection needs a matching rule in `firestore.rules`.
- Stores in `src/app/store` hold state. Components in `src/app/features` and `src/app/shared` are views. Network and Firestore I/O goes through `src/app/core`. There are two exceptions: `LayoutStore` reads and writes `localStorage` directly, and `app.ts` runs the emulator-only Firestore probe.
- Git flow: `feature/*` → `dev` → `staging` → `main`, with Conventional Commits (see `AGENTS.md`).

## Global Side Effects

- Firebase Auth (Google popup sign-in) and Firestore reads and writes per signed-in user.
- Outbound HTTP to `itunes.apple.com`, podcast RSS feeds, `corsproxy.io` and `all.api.radio-browser.info`.
- Firebase Analytics (with `ScreenTrackingService`) in every non-emulator build. Sentry error reporting when `sentryDsn` is set.
- The browser's localStorage, the service worker cache, and audio playback with Media Session.
- `scripts/firebase-add-auth-domain.mjs` changes the live Firebase Auth configuration.

## System Verification

- Run: `bunx nx test wavely`. Jest 30 is in use, so scope runs with `--testPathPatterns=<dir>`.
- Run: `bunx nx run e2e:e2e` (needs the Firebase emulators and `USE_EMULATORS=true`).
- Run: `bunx nx build wavely`.
