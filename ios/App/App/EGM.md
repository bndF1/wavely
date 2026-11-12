# ios/App/App (iOS app target)

## Overview
The native iOS app target of the Capacitor shell. `AppDelegate.swift` is the only Swift source. It is the stock Capacitor delegate, which forwards URL opens and user activities to Capacitor's `@capacitor/app` plugin. No web code imports `@capacitor/app` yet, so nothing consumes these events today. Other contents are resources and generated files: `Info.plist`, `Assets.xcassets`, `Base.lproj`, `capacitor.config.json`, `config.xml`, and `public/`. `capacitor.config.json`, `config.xml` and `public/` (the copied web bundle) are written by `cap sync` and gitignored.

## Interface
- `AppDelegate.swift:AppDelegate: UIResponder, UIApplicationDelegate` (`@UIApplicationMain`):
  - `window: UIWindow?`.
  - `application(_:didFinishLaunchingWithOptions:)` returns `true` with no customization.
  - `application(_:open:options:)` returns `ApplicationDelegateProxy.shared.application(app, open: url, options: options)`.
  - `application(_:continue:restorationHandler:)` returns `ApplicationDelegateProxy.shared.application(...)` and covers Universal Links.
  - The lifecycle hooks `applicationWillResignActive`, `applicationDidEnterBackground`, `applicationWillEnterForeground`, `applicationDidBecomeActive`, and `applicationWillTerminate` are empty.

## Invariants
- Keep the `ApplicationDelegateProxy.shared` forwarding calls. Removing them breaks deep-link and Universal Link delivery to the Capacitor App plugin.
- `capacitor.config.json` and `public/` are overwritten by `cap sync`. Edit `capacitor.config.ts` at the repository root instead.

## Side Effects
- None beyond forwarding URL and user-activity events to Capacitor's `ApplicationDelegateProxy`.

## Verification
- Run: `bun run cap:sync`, then build in Xcode (`bun run cap:ios` opens the project). There are no automated iOS tests.
