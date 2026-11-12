# core/guards

## Overview

Angular router guards. There is currently one functional guard, which gates
routes on Firebase authentication.

## Interface

- `authGuard: CanActivateFn` (`auth.guard.ts`): injects AngularFire `Auth` and
  `Router`, and reads `user(auth).pipe(take(1))`. It returns `true` when a user
  is signed in. Otherwise it returns `router.createUrlTree(['/login'])`.

## Invariants

- The guard reads only the first emission (`take(1)`), so it completes and
  never stays subscribed.
- When the user is unauthenticated, it redirects to `/login` with a `UrlTree`.
  It never returns `false`.
- It reads AngularFire `Auth` directly. It does not use `AuthService` or `AuthStore`.

## Side Effects

- None (it navigates only through the returned `UrlTree`).

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/core/guards`
