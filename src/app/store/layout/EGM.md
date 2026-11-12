# store/layout

## Overview

`LayoutStore` is a small NgRx signal store for desktop shell layout state: the
sidebar collapse and the queue panel focus.

## Interface

- `LayoutStore` (`layout.store.ts`, `signalStore({ providedIn: 'root' })`)
  - State: `sidebarCollapsed: boolean`, `queueFocused: boolean` (both default `false`).
  - Computed: `sidebarWidth`, which is the CSS var
    `'var(--sidebar-collapsed-width)'` or `'var(--sidebar-width)'`.
  - Methods:
    - `initFromStorage()`
    - `toggleSidebar()` (also triggered by the `[` key through
      `KeyboardShortcutsService`)
    - `toggleQueue()`

## Invariants

- Only `sidebarCollapsed` is persisted. `queueFocused` is memory-only.
- `initFromStorage` only sets `sidebarCollapsed: true` when the stored value is
  exactly `'true'`. Otherwise it leaves the default unchanged.
- localStorage access is skipped during SSR and wrapped in try/catch. When
  storage is unavailable, state still toggles in memory.

## Side Effects

- Reads and writes the localStorage key `wavely-sidebar-collapsed`.

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/store/layout`
