# Login Feature

## Overview
Standalone login page (`app-login`) with an inline template. It offers Google sign-in through `AuthStore` and redirects reactively once the user is authenticated.

## Interface
- `LoginPage` (`login.page.ts`) - standalone component, selector `app-login`; inline `template` and `styles`, plus `styleUrls: ['./login.page.scss']`.
  - `authStore: AuthStore` (public; the template reads `loading()` and `error()`).
  - `signIn(): Promise<void>` - calls `authStore.signInWithGoogle()`.

## Invariants
- Navigation after sign-in is driven by an `effect` on `authStore.isAuthenticated()`, not by awaiting `signIn()`. Per the source comment, the auth state updates asynchronously after the popup closes.
- Because the `effect` fires whenever `isAuthenticated()` is true, an already-authenticated user who opens this page is redirected immediately.
- While `authStore.loading()` is true, the page shows a spinner instead of the sign-in button.

## Side Effects
- Auth: `AuthStore.signInWithGoogle()` (Firebase Google sign-in).
- Navigation: `Router.navigate(['/tabs/home'])` when authenticated.
- Registers the ionicon `logoGoogle`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/login`
