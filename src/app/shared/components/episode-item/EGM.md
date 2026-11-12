# episode-item

## Overview
Standalone OnPush Ionic list item that shows one `Episode` (thumbnail, title, optional podcast title, release date, and duration) with "add to queue" and "play" buttons. It only emits events; playback and queue logic stay with the parent.

## Interface
- `EpisodeItemComponent` (`episode-item.component.ts`), selector `wavely-episode-item`, `ChangeDetectionStrategy.OnPush`, implements `OnDestroy`.
  - Inputs: `episode` (required `Episode` from `src/app/core/models/podcast.model`), `podcastTitle` (`string | null | undefined`, default `undefined`), `showPodcastTitle` (default `true`), `showReleaseDate` (default `true`), `showDuration` (default `false`).
  - Outputs: `episodePlay` (`Episode`), `addToQueue` (`Episode`).
  - Protected helpers: `emitPlay()`, `emitQueue(event)`, `formatDuration(seconds)`, `displayPodcastTitle()`, `onImageError(event)`, and the `justAdded` signal.
- Template: `episode-item.component.html`. Uses `DatePipe` (`mediumDate`), `TranslatePipe` (keys `episode.add_to_queue` and `episode.play`), and Ionic `IonItem`, `IonThumbnail`, `IonLabel`, `IonNote`, `IonButton`, `IonIcon`.
- This component is not re-exported from the shared barrel. Import it from its own file path.

## Invariants
- Clicking the whole item or the play button emits `episodePlay`. The play button calls `$event.stopPropagation()` so the event is emitted only once.
- `emitQueue` stops propagation, emits `addToQueue`, and sets `justAdded` to `true` for 2000 ms, which swaps the icon to `checkmark-outline`. Calling it again resets the timer.
- `ngOnDestroy` clears any pending `justAddedTimer`.
- `displayPodcastTitle()` resolves in this order: the `podcastTitle` input, then `episode().podcastTitle`, then `null`.
- `formatDuration` returns `''` for 0 or falsy values, `Xh Ym` when the duration is at least one hour, `Xm Ys` (seconds left out when 0) when it is at least one minute, and `Xs` otherwise.
- When the image is missing or fails to load, `/default-artwork.svg` is used instead.

## Side Effects
- The constructor registers the Ionicons `playCircleOutline`, `addOutline`, and `checkmarkOutline` globally with `addIcons`.
- `emitQueue` starts a `setTimeout` timer.
- `onImageError` changes the `src` of the `<img>` element.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=shared/components/episode-item`
