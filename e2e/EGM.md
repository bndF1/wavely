# e2e (Playwright E2E project)

## Overview
Nx project `e2e` (`projectType: application`, `implicitDependencies: ["wavely"]`). It runs Playwright browser tests against the Wavely web app. In CI it signs in once against the Firebase Auth Emulator and reuses that session through a storage-state file. Targets are inferred by the `@nx/playwright` plugin (`project.json` has an empty `targets`).

## Interface
- `playwright.config.ts` (default export `defineConfig`):
  - Extends `nxE2EPreset(__filename, { testDir: './src' })`.
  - `use.baseURL` comes from `BASE_URL`, default `http://localhost:4200`.
  - Recording: `trace` and `video` on first retry, `screenshot` only on failure.
  - `globalSetup` is `global-setup.ts` only when `USE_EMULATORS` is set.
  - With `CI` set: `fullyParallel` is false, 2 retries, 1 worker, `github` + `html` reporters, Chromium only. The web server is `bunx serve <workspaceRoot>/dist/wavely/browser -p 4200 --single`, which needs a prior e2e build.
  - Locally: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), and Mobile Safari (iPhone 12). The web server is `npx nx run wavely:serve` with `reuseExistingServer: true`.
- `global-setup.ts:globalSetup(config: FullConfig)`, the default export, runs these steps:
  1. Uses `firebase-admin` with `projectId` `wavely-f659c` against `FIREBASE_AUTH_EMULATOR_HOST` (default `127.0.0.1:9099`).
  2. Creates the test user idempotently (`TEST_USER_ID`, `TEST_USER_EMAIL`, `TEST_USER_DISPLAY_NAME`). The error `auth/uid-already-exists` is tolerated.
  3. Mints a custom token.
  4. Opens `${baseURL}/e2e-auth/<token>` in Chromium and waits up to 60 s for `/tabs/home`. Here `baseURL` comes from `config.projects[0].use.baseURL`.
  5. Saves `context.storageState` to `e2e/.auth/user.json`.
- `eslint.config.mjs`: applies `eslint-plugin-playwright` `flat/recommended` to the whole project, plus an override block for `**/*.ts` and `**/*.js` with empty rules.
- `src/`: [./src/EGM.md](./src/EGM.md): specs plus fixtures, helpers, and page objects.

## Invariants
- `global-setup.ts:AUTH_STATE_FILE` and `src/fixtures/auth.fixture.ts:AUTH_STATE_FILE` must point at the same file (`e2e/.auth/user.json`). That file is gitignored and must not be committed.
- Global setup depends on the app exposing the `/e2e-auth/:token` route and redirecting to `/tabs/home`. The comment in `global-setup.ts` says the e2e build forces `browserLocalPersistence` so that storage state captures the session.
- Global setup only makes sense against the Auth Emulator. It sets `process.env.FIREBASE_AUTH_EMULATOR_HOST` before it initializes the admin app.
- The CI web server serves `dist/wavely/browser` by absolute path (`workspaceRoot`), because the config resolves relative to `e2e/`.

## Side Effects
- Creates a user and mints a custom token in the Firebase Auth Emulator.
- Writes `e2e/.auth/user.json`, and creates the directory if needed.
- Launches browsers and spawns a web server process (`bunx serve` or `nx run wavely:serve`).
- Writes Playwright HTML reports and traces, screenshots, and videos. CI uploads `e2e/playwright-report/`.
- Forwards browser console output and page errors to stdout during global setup.

## Verification
- Run: `bunx nx run e2e:e2e`. Authenticated flows need emulators, for example `bunx firebase-tools emulators:start --only auth,firestore --project wavely-f659c`, plus `USE_EMULATORS=true`. See `.github/workflows/e2e.yml`.
