# environments

## Overview

Build-time environment configuration for the `wavely` Angular app. The app imports
`environment` from `src/environments/environment`, and Nx/Angular `fileReplacements`
in `project.json` swap in the file for each configuration. Only two files are
tracked in git; the rest are generated at build time by
[`scripts/generate-env.mjs`](../../scripts/generate-env.mjs) from GitHub Actions secrets.

| File | Tracked | Role |
|------|---------|------|
| `environment.e2e.ts` | yes | E2E build (`wavely:build:e2e`); fake Firebase config pointed at local emulators |
| `ng-env.d.ts` | yes | Types `import.meta.env` as `Record<string, string \| undefined>`. Its only reader is `src/app/core/services/firebase.config.ts`, which nothing imports |
| `environment.ts` | **no (gitignored)** | Default/dev environment, generated |
| `environment.prod.ts` | **no (gitignored)** | Replaces `environment.ts` in the `production` configuration, generated |
| `environment.staging.ts` | **no (gitignored)** | Replaces `environment.ts` in the `staging` configuration, generated |

## Interface

- `environment` (exported const, `environment.e2e.ts:4`), with these fields:
  - `production: boolean`: `false` in e2e
  - `appVersion: string`. Generated files use the latest git tag. `environment.e2e.ts` hard-codes a stale `'1.3.2-e2e'`.
  - `useEmulators: boolean`: `true` in e2e. It gates the Auth and Firestore emulator connections in `src/app/app.config.ts`, the `e2e-auth/:token` route in `src/app/app.routes.ts`, and the `window.__e2eNavigate` / `__e2eAuthReady` hooks in `src/app/app.ts`
  - `sentryDsn: string`: empty means Sentry is not initialised (`src/main.ts`)
  - `firebase: { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId }`, passed to `initializeApp` in `src/app/app.config.ts`
- `interface ImportMeta { readonly env: Record<string, string | undefined> }` (`ng-env.d.ts`)

## Invariants

- **Never commit** `environment.ts`, `environment.prod.ts` or `environment.staging.ts`. They are listed in `.gitignore` because they hold real Firebase and Sentry credentials, and they are produced by `scripts/generate-env.mjs`.
- Every environment file must export the same `environment` shape, because `fileReplacements` swaps them without type adaptation.
- `environment.e2e.ts` must keep `useEmulators: true` and must never be deployed. The e2e configuration also replaces `src/app/app.routes.server.ts` with `app.routes.server.e2e.ts`.
- Secret values are build-time only and must use the `NG_APP_*` prefix when injected.

## Side Effects

- None. These files only declare data. The consumers (`app.config.ts`, `main.ts`) perform the network effects: Firebase init, emulator connections on `localhost:9099` / `localhost:8080`, and Sentry.

## Verification

- Run: `bunx nx build wavely --configuration=e2e` (checks that the e2e replacement type-checks)
- Run: `bunx nx test wavely`
