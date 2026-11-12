# app

## Overview

The root of the Angular standalone app. This directory holds the root component (`App`),
the browser and server application configs, the client route table and the SSR render-mode
tables. Feature code is split into four layers:

- `core/`: services, guard, auth wrapper and domain models (network, Firestore and most storage I/O)
- `store/`: NgRx signal stores (reactive state; `LayoutStore` also persists to `localStorage` directly)
- `features/`: lazy-loaded route components (views)
- `shared/`: reusable presentational components

## Interface

- `app.ts:App` (selector `app-root`, imports `IonApp`, `IonRouterOutlet`). It eagerly injects `AudioService`, `ThemeService`, `LanguageService` and `KeyboardShortcutsService`, and calls `AuthStore.init()` in its constructor.
- `app.config.ts:appConfig: ApplicationConfig`. Providers: router with `PreloadAllModules`, `HttpClient(withFetch)`, client hydration with event replay, ngx-translate (`fallbackLang: 'en'`, loader `/i18n/*.json`), Firebase App/Auth/Firestore, Analytics with `ScreenTrackingService` (non-emulator builds only), Ionic (`mode: 'md'`), the service worker `ngsw-worker.js`, and the Sentry `ErrorHandler` and `TraceService`.
- `app.config.server.ts:config`: `appConfig` merged with `provideServerRendering(withRoutes(serverRoutes))`.
- `app.routes.ts:appRoutes: Route[]`:
  - `''` redirects to `tabs`
  - `login`
  - `e2e-auth/:token` (emulators only)
  - `tabs` (`authGuard`), with children `home`, `discover`, `radio`, `library`; `browse` and `search` redirect to `discover`
  - `browse/category/:genreId`
  - `podcast/:id`
  - `publisher/:artistId`
  - `settings` (`authGuard`)
- `app.routes.server.ts:serverRoutes: ServerRoute[]`: `podcast/:id` uses `RenderMode.Server`, the app routes use `RenderMode.Client`, and `**` uses `RenderMode.Prerender`.
- `app.routes.server.e2e.ts:serverRoutes`: replaces the file above in the `e2e` build configuration. It adds `e2e-auth/:token` and renders `podcast/:id` on the client. It has no `settings` entry, so `settings` is prerendered in e2e builds ([#384](https://github.com/bndF1/wavely/issues/384)).
- `nx-welcome.ts:NxWelcome` (selector `app-nx-welcome`): leftover Nx scaffold. No other file in `src/app` imports it.
- Child contracts:
  - [core](./core/EGM.md): auth, guard, models and services
  - [store](./store/EGM.md): signal stores
  - [features](./features/EGM.md): route pages and the player views
  - [shared](./shared/EGM.md): shared UI components

## Invariants

- Firebase is initialised at module load in `app.config.ts` (`if (getApps().length === 0) initializeApp(environment.firebase)`). This avoids an `app/no-app` race during DI hydration. `provideFirebaseApp` only calls `getApp()`.
- When `environment.useEmulators` is set, Auth uses `browserLocalPersistence` and connects to `http://localhost:9099`, and Firestore connects to `localhost:8080`. Analytics is not provided.
- `AudioService`, `ThemeService`, `LanguageService` and `KeyboardShortcutsService` must be injected in `App` so they register their effects and listeners before the first render or playback.
- The `e2e-auth/:token` route and the `window.__e2eNavigate` / `window.__e2eAuthReady` hooks exist only when `environment.useEmulators` is true and the code runs in the browser.
- The client routes and the server route tables must stay in sync. A new client route needs an entry in both `app.routes.server.ts` and `app.routes.server.e2e.ts`, or it falls through to `**` (Prerender).
- The service worker is enabled only when `!isDevMode()`.

## Side Effects

- `app.config.ts`: Firebase `initializeApp` at import time. The emulator connections, Analytics, the service worker registration (`registerWhenStable:30000`) and the Sentry error handler are installed through providers.
- `app.ts` (emulator builds, browser only): sets `window.__e2eNavigate`. Once a user signs in, it probes Firestore with `getDocs` plus a `setDoc`/`deleteDoc` on `users/{uid}/subscriptions/__e2e_probe`, retrying up to 10 times at 200 ms intervals, and then sets `window.__e2eAuthReady = true`. The flag is set even when all 10 attempts fail.

## Verification

- Run: `bunx nx test wavely`
- Run: `bunx nx run e2e:e2e` (needs the Firebase emulators and `USE_EMULATORS=true`)
