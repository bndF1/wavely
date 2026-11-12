# podcast-card

## Overview
Standalone presentational card that shows a `Podcast` (artwork, title, author). It can be activated by mouse or keyboard and has a skeleton loading state. It imports no Ionic components.

## Interface
- `PodcastCardComponent` (`podcast-card.component.ts`), selector `wavely-podcast-card`, `imports: []`.
  - Inputs: `podcast` (required `Podcast` from `src/app/core/models/podcast.model`), `loading` (`boolean`, default `false`).
  - Output: `cardClick` (`Podcast`).
  - Public methods: `onImageError(event)`, `onSpaceKey(event)`.
- Template: `podcast-card.component.html` (root element `<article>`).
- This component is not re-exported from the shared barrel.

## Invariants
- `cardClick` is emitted on click, Enter, or Space, and only when `loading()` is `false`. `onSpaceKey` calls `preventDefault()` to stop the page from scrolling, but only when not loading, because the loading check returns first.
- When `loading()` is `true`, the card gets the `podcast-card--skeleton` class, its `role` and `tabindex` attributes are removed, and skeleton boxes replace the artwork and text.
- `podcast` is still a required input while loading.
- When artwork is missing or fails to load, `/default-artwork.svg` is used instead.

## Side Effects
- `onImageError` changes the `src` of the `<img>` element. There are no other side effects.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=shared/components/podcast-card`
