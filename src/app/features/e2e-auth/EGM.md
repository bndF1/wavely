# E2E Auth Route

## Overview
Test-only component used by the Playwright suite. It signs in to Firebase Auth with a custom token taken from the URL (minted by the Playwright global setup against the Auth Emulator), then redirects to the app. Per the source docblock, the route `/e2e-auth/:token` is registered only when `environment.useEmulators === true`, so production builds tree-shake this component.

## Interface
- `E2eAuthComponent` (`e2e-auth.component.ts`) - standalone component, selector `wavely-e2e-auth`, inline template; implements `OnInit`.
  - `ngOnInit(): Promise<void>` - performs the sign-in flow.

## Invariants
- Must stay reachable only in emulator builds. The route gating is in the app routes, not in this directory.
- The token comes from route param `token`; a missing param becomes `''`.
- If `signInWithCustomToken` throws, the component logs the error and does not navigate.
- After sign-in, it waits up to 10 s (`timeout(10_000)`) for AngularFire `user(auth)` to emit a non-null user. On timeout it navigates only if `auth.currentUser` is set.

## Side Effects
- Firebase Auth: `signInWithCustomToken(this.auth, token)` changes the global auth session.
- Navigation: `Router.navigate(['/tabs/home'])` on success.
- Console logging of emulator config, uid, and failures (`console.log`, `console.warn`, `console.error`). The token itself is never logged and must stay that way.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/e2e-auth`
- Note: this directory currently has no `*.spec.ts`, so the scoped command reports "No tests found". Run `bunx nx test wavely` for the full suite.
