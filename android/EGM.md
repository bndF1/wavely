# android

## Overview
The Capacitor-generated Android Gradle project that packages the Wavely web app (`webDir: dist/wavely/browser` in `capacitor.config.ts`) as a native app.
- Configuration in `android/app/build.gradle` and `android/variables.gradle`:
  - `namespace` and `applicationId` are `io.wavely.app`.
  - SDK levels: `minSdkVersion` 24, `compileSdkVersion` 36, `targetSdkVersion` 36.
  - The build applies `capacitor.build.gradle` and depends on `:capacitor-cordova-android-plugins`.
- The `com.google.gms.google-services` plugin is applied only when `app/google-services.json` exists and is non-empty. Otherwise the build logs an info message and continues. Without that file, push notifications do not work.
- `versionCode 1` and `versionName "1.0"` are hard-coded in `app/build.gradle` and do not follow `package.json`.
- Not documented, because they are generated or non-source: `app/src/main/assets/public` (the copied web bundle, gitignored), `res/`, `gradle/`, and the template `androidTest/` and `test/` folders.

## Subdirectories & Boundaries
- app/src/main/java/io/wavely/app: [./app/src/main/java/io/wavely/app/EGM.md](./app/src/main/java/io/wavely/app/EGM.md): `MainActivity`, an empty Capacitor `BridgeActivity`. It is the only hand-maintained Java source.
