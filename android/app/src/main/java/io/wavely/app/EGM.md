# io.wavely.app (Android entry point)

## Overview
The Java entry point of the Capacitor Android shell for Wavely. All app logic lives in the Angular/Ionic web bundle. At build time `cap sync` copies that bundle into `android/app/src/main/assets/public`, which is generated and gitignored. Capacitor's `BridgeActivity` hosts it in a WebView.

## Interface
- `MainActivity.java:MainActivity extends com.getcapacitor.BridgeActivity` has an empty body and no overrides.

## Invariants
- The package `io.wavely.app` must match `namespace`/`applicationId` in `android/app/build.gradle` and `appId` in the root `capacitor.config.ts`.
- Native plugins (App, Haptics, Keyboard, PushNotifications, SplashScreen, StatusBar) are registered by Capacitor through `capacitor.build.gradle` and the `capacitor-cordova-android-plugins` project, not in this class.

## Side Effects
- None in code. Activity lifecycle, WebView creation, and plugin bridging are inherited from `BridgeActivity`.

## Verification
- Run: `bun run cap:sync`, then build in Android Studio (`bun run cap:android` opens the project). There are no meaningful Android unit tests; `androidTest/` and `test/` hold only template examples.
