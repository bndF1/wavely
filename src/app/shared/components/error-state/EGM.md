# error-state

## Overview
Standalone OnPush Ionic component that renders an error placeholder (icon, title, message) with a retry button.

## Interface
- `ErrorStateComponent` (`error-state.component.ts`), selector `app-error-state` (note: the `app-` prefix, unlike the other shared components, which use `wavely-`), `standalone: true`, `ChangeDetectionStrategy.OnPush`.
  - Inputs, all optional with English defaults: `title` (`'Something went wrong'`), `message` (`'Failed to load content'`), `icon` (`'cloud-offline-outline'`), `retryLabel` (`'Try Again'`).
  - Output: `retry` (`void`), emitted straight from the template button.
- Template: `error-state.component.html`. Imports `IonIcon`, `IonButton`.
- Re-exported from the shared barrel [`../../index.ts`](../../index.ts).

## Invariants
- The retry button is always rendered.
- The icon has `aria-hidden="true"`.
- The default strings are hardcoded English and do not go through i18n. Callers pass translated text through the inputs.

## Side Effects
- The constructor registers the Ionicon `cloudOfflineOutline` globally with `addIcons`.

## Verification
- No spec file exists for this component. `bunx nx test wavely --testPathPatterns=shared/components/error-state` finds no tests. Run `bunx nx test wavely --testPathPatterns=src/app/shared` to cover the shared layer.
