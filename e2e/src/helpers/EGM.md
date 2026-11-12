# e2e helpers

## Overview
Small helpers that make Playwright interactions with the Wavely Angular/Ionic app reliable.

## Interface
- `interactions.ts:clickInViewport(locator: Locator): Promise<void>`: scrolls the locator into view, then calls `locator.click({ force: true })`. If Playwright throws an error containing `outside of the viewport`, it falls back to `el.click()` inside the page. Any other error is rethrown. Used by `player.spec.ts` and `subscription.spec.ts`.
- `auth-mock.ts:mockFirebaseAuthUser(page, user | null): Promise<void>`: registers `page.addInitScript` to set `window.__PLAYWRIGHT_MOCK_USER__`. This value is informational only. The helper does not actually bypass Firebase Auth. The source has a TODO to replace it with the Auth Emulator. No spec currently imports it.
- `auth-mock.ts:navigateTo(page, path): Promise<void>`: calls `page.goto(path)` and then waits up to 10 s for `ion-app`. No spec currently imports it.

## Invariants
- `clickInViewport` falls back to a DOM `click()` only when the viewport error occurs. All other click failures still fail the test.
- Real authentication in E2E tests comes from `../fixtures/auth.fixture.ts` plus `e2e/global-setup.ts`, not from `mockFirebaseAuthUser`.

## Side Effects
- `mockFirebaseAuthUser` injects an init script that writes a global on `window` in every page load of that `page`.
- `clickInViewport` and `navigateTo` drive the browser (scrolling, clicks, navigation).

## Verification
- Run: `bunx nx run e2e:e2e`
