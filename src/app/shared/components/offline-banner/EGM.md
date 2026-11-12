# offline-banner

## Overview
Standalone Ionic banner that appears while the device is offline. It reads `NetworkService` and can be dismissed. Dismissing it lasts only until connectivity comes back.

## Interface
- `OfflineBannerComponent` (`offline-banner.component.ts`), selector `wavely-offline-banner`. It has no inputs and no outputs.
  - Injects `NetworkService` (`src/app/core/services/network.service`) and reads its `isOnline()` signal.
  - Internal state: private `dismissed` signal, protected computed `isVisible`, protected `dismiss()`.
- Template: `offline-banner.component.html`. Uses `TranslatePipe` (keys `offline.message` and `offline.dismiss`), `IonIcon`, `IonButton`.
- This component is not re-exported from the shared barrel.

## Invariants
- `isVisible` is `!network.isOnline() && !dismissed()`.
- An `effect` sets `dismissed` back to `false` whenever `network.isOnline()` is `true`, so the banner shows again on the next time the device goes offline.
- The banner container has `role="status"` and `aria-live="polite"`.

## Side Effects
- The constructor registers the Ionicons `warningOutline` and `closeOutline` globally with `addIcons`.
- It creates an Angular `effect` that subscribes to the `NetworkService.isOnline` signal.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=shared/components/offline-banner`
