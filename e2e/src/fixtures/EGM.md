# e2e fixtures

## Overview
Playwright test fixtures for the Wavely E2E suite. Currently one fixture module, `auth.fixture.ts`. It extends Playwright's base `test` so that every `context` and `page` starts pre-authenticated from the browser storage state saved by [`../../global-setup.ts`](../../EGM.md).

## Interface
- `auth.fixture.ts:test`: `base.extend({ context, page })`. Overrides two fixtures:
  - `context`: a new `browser.newContext({ storageState })` that uses `AUTH_STATE_FILE` if the file exists, otherwise starts with no stored state.
  - `page`: a new page opened in that context and closed after use.
- `auth.fixture.ts:expect`: re-export of Playwright's `expect`.
- Consumers: `browse`, `home`, `navigation`, `player`, `search`, and `subscription` specs import `{ test, expect }` from `./fixtures/auth.fixture`.

## Invariants
- `auth.fixture.ts:AUTH_STATE_FILE` resolves to `e2e/.auth/user.json` (`path.join(__dirname, '../../.auth/user.json')`). This must stay the same path that `e2e/global-setup.ts:AUTH_STATE_FILE` writes.
- If the state file is missing (for example, `USE_EMULATORS` is unset so global setup did not run), the fixture does not throw. Tests run unauthenticated instead.
- `e2e/.auth/user.json` holds a live auth session. It is gitignored (`.gitignore`) and must never be committed.

## Side Effects
- Reads the local filesystem (`existsSync(AUTH_STATE_FILE)`) and loads the stored browser state (localStorage/cookies) into each new context.
- Creates and closes one browser context and one page per test.

## Verification
- Run: `bunx nx run e2e:e2e` (authenticated flows need the Firebase Auth and Firestore emulators running and `USE_EMULATORS=true`).
