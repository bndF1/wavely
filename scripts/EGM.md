# scripts

## Overview
Node.js (ESM) build and deploy utilities that are invoked from `package.json` scripts and GitHub Actions workflows. `generate-env.mjs` turns environment variables into the gitignored Angular environment files at build time. `firebase-add-auth-domain.mjs` authorizes Firebase Hosting preview-channel domains for Firebase Auth after a deploy.

## Interface
- `generate-env.mjs` (CLI, no exports):
  - Usage: `node --env-file=.env scripts/generate-env.mjs` (`bun run generate-env`, also run by `bun run start` with `ENV_TARGET=dev`), or `ENV_TARGET=<target> node scripts/generate-env.mjs` in CI.
  - `ENV_TARGET` accepts `all` (default), `dev`, `prod`, or `staging`.
  - Required variable names (`REQUIRED_KEYS`): `NG_APP_FIREBASE_API_KEY`, `NG_APP_FIREBASE_AUTH_DOMAIN`, `NG_APP_FIREBASE_PROJECT_ID`, `NG_APP_FIREBASE_STORAGE_BUCKET`, `NG_APP_FIREBASE_MESSAGING_SENDER_ID`, `NG_APP_FIREBASE_APP_ID`.
  - Optional variable names: `NG_APP_FIREBASE_MEASUREMENT_ID` and `NG_APP_SENTRY_DSN`.
  - For `staging`, `get(key)` returns `process.env[<KEY>_STAGING] ?? process.env[<KEY>]`. It falls back only when `<KEY>_STAGING` is undefined, not when it is empty.
  - Any other `ENV_TARGET` value writes nothing and exits 0.
  - No workflow currently runs `ENV_TARGET=staging`. The staging deploy runs the default `all` target and then `ENV_TARGET=prod`.
  - Outputs, each a TypeScript module exporting `environment` with the fields `production`, `appVersion`, `useEmulators: false`, `sentryDsn`, and `firebase{...}`:
    - `src/environments/environment.ts`: for `dev` or `all`, `production: false`.
    - `src/environments/environment.prod.ts`: for `prod` or `all`, `production: true`, and the only file that gets the Sentry DSN.
    - `src/environments/environment.staging.ts`: for `staging` or `all`, `production: false`.
  - `appVersion` is the latest git tag (`git describe --tags --abbrev=0`) with the leading `v` stripped. If that fails, it falls back to `package.json` `version`, then to `0.0.0`.
- `firebase-add-auth-domain.mjs` (CLI, no exports):
  - Usage: `node scripts/firebase-add-auth-domain.mjs <domain>`.
  - Requires the env vars `NG_APP_FIREBASE_PROJECT_ID` and `FIREBASE_TOKEN` (a Firebase CI refresh token).
  - Functions: `getAccessToken()`, `getAuthorizedDomains(accessToken)`, `addAuthorizedDomain(accessToken, domains)`.
  - Called by `.github/workflows/firebase-hosting-dev.yml` and `firebase-hosting-staging.yml` after a channel deploy.

## Invariants
- The generated `src/environments/environment*.ts` files contain real credentials. They are gitignored on purpose and must never be committed. Never log their values. The script itself prints only file names and missing key names.
- For `prod` and `staging`, `generate-env.mjs` exits with code 1 and lists missing key names (with `_STAGING` suffixes for staging) if any `REQUIRED_KEYS` value is empty. For `dev` and `all`, missing values become empty strings without an error.
- `generate-env.mjs` reads `package.json` through a relative path and writes `src/environments/...` relative paths, so it must run from the repository root.
- `firebase-add-auth-domain.mjs` is idempotent: if the domain is already in `authorizedDomains`, it exits 0 without patching. It sends the full existing list plus the new domain, so it never removes domains.
- `firebase-add-auth-domain.mjs` is deliberately non-fatal. Any API failure is logged and the script exits with code 0, so the deploy does not fail. It exits with code 1 only for a missing `<domain>` argument or missing env vars.
- `firebase-add-auth-domain.mjs` embeds the Firebase CLI's public installed-app OAuth client identifiers (`CLIENT_ID` and `CLIENT_SECRET` constants, copied from `firebase-tools`). These are not project secrets. Do not add any project-specific secret alongside them.

## Side Effects
- `generate-env.mjs` overwrites up to three files under `src/environments/` and runs the child process `git describe --tags --abbrev=0`.
- `firebase-add-auth-domain.mjs` makes network calls:
  - POST `https://oauth2.googleapis.com/token`, exchanging the refresh token for an access token.
  - GET `https://identitytoolkit.googleapis.com/admin/v2/projects/<projectId>/config`, then PATCH the same URL with `?updateMask=authorizedDomains`. The PATCH changes the production Firebase Auth configuration.
  - If the token exchange fails, the OAuth error response body is logged to stderr.

## Verification
- No automated tests cover these scripts. To smoke-test locally, run `bun run generate-env` and confirm that `src/environments/environment*.ts` are regenerated. Do not commit the output.
