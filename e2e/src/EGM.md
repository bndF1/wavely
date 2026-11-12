# e2e/src

## Overview
The Playwright test source root (`sourceRoot` in `e2e/project.json`, `testDir: './src'` in `playwright.config.ts`). It holds the `*.spec.ts` suites (`browse`, `home`, `login`, `navigation`, `player`, `podcast-detail`, `search`, `subscription`) and three support packages. The specs are not documented here.

## Subdirectories & Boundaries
- fixtures: [./fixtures/EGM.md](./fixtures/EGM.md): `test`/`expect` with a pre-authenticated context loaded from `e2e/.auth/user.json`.
- helpers: [./helpers/EGM.md](./helpers/EGM.md): `clickInViewport`, plus the unused `mockFirebaseAuthUser` and `navigateTo`.
- page-objects: [./page-objects/EGM.md](./page-objects/EGM.md): `LoginPage` and `TabsPage` selector wrappers. No spec uses either one, and `LoginPage`'s selectors are stale ([#385](https://github.com/bndF1/wavely/issues/385)).
