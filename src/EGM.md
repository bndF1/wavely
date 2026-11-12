# src

## Overview

Source root of the `wavely` Nx/Angular project. It holds the browser and SSR entry
points, the Express SSR server, global styles, the PWA manifest and the Jest setup.
App code lives in `app/`. Build-time configuration lives in `environments/`.
`testing/` holds shared Jest fixtures and mocks only, so it has no contract.

## Interface

- `main.ts`: browser bootstrap, `bootstrapApplication(App, appConfig)`. It calls `Sentry.init` first, but only when `environment.sentryDsn` is non-empty.
- `main.server.ts`: default export `bootstrap(context: BootstrapContext)` that calls `bootstrapApplication(App, config, context)` with the server config.
- `server.ts`: Express SSR host.
  - `reqHandler = createNodeRequestHandler(app)`.
  - Serves static files from `../browser` (`maxAge: '1y'`, `index: false`) and sends every other request to `AngularNodeAppEngine.handle`.
  - Listens on `process.env['PORT'] || 4000` only when it is the main module or runs under PM2 (`process.env['pm_id']`).
- `test-setup.ts`: Jest setup for `bunx nx test wavely`. Uses `setupZonelessTestEnv` (zoneless) with unknown-element errors enabled, plus `@testing-library/jest-dom`.
- `index.html`, `styles.scss`, `manifest.webmanifest`: app shell, global styles and PWA manifest. `src/ngsw-config.json` is an unused duplicate. `project.json` uses the root `ngsw-config.json`, and only in the `production` configuration.
- Child contracts:
  - [app](./app/EGM.md): root component, config, routes and the core, store, features and shared layers
  - [environments](./environments/EGM.md): `environment` per build configuration (credential files are generated and gitignored)

## Invariants

- Sentry tracing runs only when a DSN is configured. `tracePropagationTargets` covers `localhost` and `https://wavely-f659c.web.app`.
- `server.ts` defines no API routes. Unmatched requests go to `next()`.
- Production hosting (`firebase.json`) serves the static `dist/wavely/browser` output with an SPA rewrite to `/index.html`. `server.ts` is used only for SSR via the Angular CLI or Node.

## Side Effects

- `main.ts`: Sentry network reporting when a DSN is set.
- `server.ts`: opens an HTTP listener on `PORT` (default 4000) and reads static files from disk.

## Verification

- Run: `bunx nx test wavely`
- Run: `bunx nx build wavely`
