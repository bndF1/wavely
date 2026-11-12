# e2e page objects

## Overview
Page Object Model classes that wrap Playwright selectors for Wavely screens. **Both classes are currently unused, and `LoginPage` is stale** ([#385](https://github.com/bndF1/wavely/issues/385)). Do not rely on them without updating them first.

## Interface
- `pages.ts:LoginPage(page)`:
  - `goto()`: navigates to `/login` and waits up to 10 s for `wavely-login`. The app's selector is `app-login`, so this wait always times out, and the timeout is swallowed.
  - `googleSignInButton`: `getByText(/sign in with google/i)`. The button text is actually "Continue with Google", so this matches nothing.
  - `emailInput`: `ion-input[type="email"], input[type="email"]`.
  - `passwordInput`: `ion-input[type="password"], input[type="password"]`.
  - `emailInput` and `passwordInput` match nothing, because the login page has no email or password fields.
  - `login.spec.ts` imports `LoginPage` but never uses it.
- `pages.ts:TabsPage(page)`:
  - `waitForLoad()`: waits up to 10 s for `wavely-tabs, ion-tab-bar`.
  - `tab(label)`: `getByRole('tab', { name: RegExp(label, 'i') })`.
  - No spec currently imports it.

## Invariants
- Selectors must track the app's component selectors and Ionic elements. `wavely-tabs` matches `TabsComponent`. `wavely-login` does not match `LoginPage` (`app-login`).

## Side Effects
- Browser navigation and DOM queries only.

## Verification
- Run: `bunx nx run e2e:e2e`
