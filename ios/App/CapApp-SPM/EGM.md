# CapApp-SPM

## Overview
A Swift Package Manager package, managed by the Capacitor CLI, that hosts the iOS app's SPM dependencies on Capacitor and its plugins. The existing [README.md](./README.md) states: "This package is used to host SPM dependencies for your Capacitor project. Do not modify the contents of it or there may be unintended consequences."

## Interface
- `Package.swift` (`swift-tools-version: 5.9`):
  - Declares package and library product `CapApp-SPM` (target `CapApp-SPM`) on `platforms: [.iOS(.v15)]`.
  - Dependencies:
    - `capacitor-swift-pm` at `exact: "8.2.0"`, providing the `Capacitor` and `Cordova` products.
    - Local `node_modules/@capacitor/*` packages: `CapacitorApp`, `CapacitorHaptics`, `CapacitorKeyboard`, `CapacitorPushNotifications`, `CapacitorSplashScreen`, `CapacitorStatusBar`.
- `Sources/CapApp-SPM/CapApp-SPM.swift:isCapacitorApp`: `public let isCapacitorApp = true`, a placeholder symbol so the target has a source file.

## Invariants
- `Package.swift` says `DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands`. `cap sync` regenerates it from installed `@capacitor/*` packages. Change plugins through `package.json`, not here.
- Local plugin paths (`../../../node_modules/@capacitor/...`) require `node_modules` to be installed at the repository root.
- The `capacitor-swift-pm` version is pinned exactly (8.2.0) and should match `@capacitor/ios` in `package.json`.

## Side Effects
- None at runtime. SPM resolution fetches `https://github.com/ionic-team/capacitor-swift-pm.git` during Xcode builds.

## Verification
- Run: `bun run cap:sync`, then build in Xcode (`bun run cap:ios`).
