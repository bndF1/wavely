# empty-state

## Overview
Standalone presentational Angular/Ionic component that renders an empty-list placeholder (icon, title, subtitle) with an optional call-to-action button. It holds no state and injects no services.

## Interface
- `EmptyStateComponent` (`empty-state.component.ts`), selector `wavely-empty-state`.
  - Inputs: `icon` (required `string`, Ionicons name), `title` (required `string`), `subtitle` (required `string`), `actionLabel` (`string | null`, default `null`).
  - Output: `action` (`void`), emitted by the protected `emitAction()` when the button is clicked.
- Template: `empty-state.component.html`. Imports `IonIcon`, `IonText`, `IonButton`.
- Re-exported from the shared barrel [`../../index.ts`](../../index.ts).

## Invariants
- The action button renders only when `actionLabel()` is truthy (`@if (actionLabel())`).
- The root element has `role="status"` and `aria-live="polite"`.
- The component does not call `addIcons`. Callers must make sure the `icon` name is registered elsewhere.

## Side Effects
- None. The component only emits the `action` output.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=shared/components/empty-state`
