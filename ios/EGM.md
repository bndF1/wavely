# ios

## Overview
The Capacitor-generated Xcode project that packages the Wavely web app as a native iOS app (`appId` `io.wavely.app`, iOS options in the root `capacitor.config.ts`). Native code is minimal: a stock Capacitor `AppDelegate` plus an SPM package that pulls in Capacitor and plugins. Not documented, because they are generated or non-source: `App/App.xcodeproj`, `App/App/public` (the copied web bundle, gitignored), `capacitor-cordova-ios-plugins`, and `debug.xcconfig`.

## Subdirectories & Boundaries
- App/App: [./App/App/EGM.md](./App/App/EGM.md): `AppDelegate`, which forwards URL opens and Universal Links to Capacitor's `ApplicationDelegateProxy`. No web code consumes these events yet.
- App/CapApp-SPM: [./App/CapApp-SPM/EGM.md](./App/CapApp-SPM/EGM.md): the CLI-managed SPM package that pins `capacitor-swift-pm` 8.2.0 and the local `@capacitor/*` plugins.
