# Publisher Feature

## Overview
Routed page (`wavely-publisher`) that lists all podcasts by one publisher (iTunes artist), using the `artistId` route parameter. Uses client-side "load more" pagination. Reached from `PodcastDetailPage.navigateToPublisher()`.

## Interface
- `PublisherPage` (`publisher.page.ts`) - OnPush standalone component, selector `wavely-publisher`.
  - Signals: `artistId`, `publisherName`, `podcasts`, `visibleCount`, `isLoading`, `error`.
  - Computed: `visiblePodcasts`, `canLoadMore`.
  - Template-facing methods: `loadMore()`, `retry()`, `navigateToPodcast(podcast)`.
  - Module constants: `SKELETON_COUNT = 6`, `PAGE_SIZE = 12`.
- Template: `publisher.page.html`.

## Invariants
- A missing `artistId` param sets the "Invalid publisher" error and makes no API call. That text is never rendered; the template shows the translated `publisher.error_subtitle`. `retry()` does nothing when `artistId()` is null.
- `publisherName` defaults to `'Publisher'` and is replaced by `podcasts[0].author` only when results are non-empty.
- Each param change resets loading state and pagination, and `switchMap` cancels in-flight requests. It does **not** reset `artistId` or `publisherName`, so a stale name or retry target can survive a param change ([#383](https://github.com/bndF1/wavely/issues/383)).
- `visibleCount` is clamped to `podcasts().length`.
- Subscriptions are torn down with `takeUntilDestroyed(DestroyRef)`.

## Side Effects
- Network: `PodcastApiService.getPublisherPodcasts(artistId)`. Errors are caught into `error`.
- Navigation: `/podcast/:id`.

## Verification
- Run: `bunx nx test wavely --testPathPatterns=src/app/features/publisher`
