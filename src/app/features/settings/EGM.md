# Settings Feature

## Overview
Settings page (`wavely-settings`) for theme mode, the auto-queue preference, and UI language, plus a display of the app version. All persistence is delegated to core services.

## Interface
- `SettingsPage` (`settings.page.ts`) - OnPush standalone component, selector `wavely-settings`.
  - Exposed: `themeService: ThemeService`, `prefs: UserPreferencesService`, `languageService: LanguageService`, `appVersion` (`environment.appVersion`).
  - `themeOptions` - `system` / `light` / `dark` (`ThemeMode`), labeled with i18n keys `settings.theme_*`.
  - Methods: `onAutoQueueChange(event)` (sets `prefs.setAutoQueueEnabled(checked)`) and `onLanguageChange(event)` (sets `languageService.setLanguage(value)`).
- Template: `settings.page.html`. The theme radio group calls `themeService.setMode(value)` directly.

## Invariants
- The page holds no state of its own; preferences live in and are persisted by `ThemeService`, `UserPreferencesService`, and `LanguageService`.
- `prefs.autoQueueEnabled()` (set here) controls whether `HomePage` and `PodcastDetailPage` auto-queue the following episodes on play.

## Side Effects
- Preference mutations: `ThemeService.setMode`, `UserPreferencesService.setAutoQueueEnabled`, `LanguageService.setLanguage`. These services handle storage and theme/i18n application.
- Registers ionicons through `addIcons`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/settings`
- Note: this directory currently has no `*.spec.ts`, so the scoped command reports "No tests found". Run `bunx nx test wavely` for the full suite.
