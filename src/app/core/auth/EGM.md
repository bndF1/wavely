# core/auth

## Overview

Thin injectable wrapper around AngularFire Auth (`@angular/fire/auth`). It is the
only place in `core/` that triggers Google sign-in/sign-out. Application state
derived from the auth user lives in
[`store/auth`](../../store/auth/EGM.md) (`AuthStore`), which subscribes to
`AuthService.user$`.

## Interface

- `AuthService` (`auth.service.ts`, `@Injectable({ providedIn: 'root' })`)
  - `user$: Observable<User | null>`: AngularFire `user(auth)` stream (`User` from `firebase/auth`).
  - `signInWithGoogle(): Promise<void>`: `signInWithPopup` with a new `GoogleAuthProvider`.
  - `signOut(): Promise<void>`: AngularFire `signOut`.
  - `getCurrentUser(): User | null`: synchronous `auth.currentUser`.

## Invariants

- Errors from `signInWithPopup` / `signOut` are not caught here; callers
  (`AuthStore.signInWithGoogle`) handle them.
- The service holds no state of its own. `user$` is the source of truth for
  auth transitions.

## Side Effects

- `signInWithGoogle` opens a browser popup and makes Firebase Auth network calls.
- `signOut` clears the Firebase Auth session.

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/core/auth`
