# core/models

## Overview

Pure TypeScript domain interfaces that services and stores share. The directory
has no runtime code.

`PlaybackProgress` and `Subscription` are not imported anywhere. Persisted
progress uses `EpisodeProgress` (`core/services/progress-sync.service.ts`), and
subscriptions are stored as full `Podcast` documents.

## Interface

- `podcast.model.ts`
  - `Podcast`: `id`, `title`, `author`, `description`, `artworkUrl`, `feedUrl`, `genres: string[]`,
    optional `episodeCount`, `latestReleaseDate`, `artistId` (iTunes artist ID; absent on RSS chart entries).
  - `Episode`: `id`, `podcastId`, `title`, `description`, `audioUrl`, `duration` (seconds), `releaseDate`,
    optional `imageUrl`, `podcastTitle`, `fileSize`, `isLive` (true for live radio streams).
  - `PlaybackProgress`: `episodeId`, `position`, `duration`, `completed`, `updatedAt: Date`.
  - `Subscription`: `podcastId`, `subscribedAt: Date`, optional `lastSeen`.
- `radio-station.model.ts`
  - `RadioStation`: Radio Browser API shape (`stationuuid`, `name`, `url_resolved`, `favicon`,
    `countrycode`, `language`, `tags`, `votes`, `clickcount`, `bitrate`, `codec`).

## Invariants

- `Episode.isLive === true` means the episode is a live radio stream. Per the
  field doc comment, it disables the scrubber, speed controls, and progress sync.
  `radioStationToEpisode` sets this flag, and `AudioService` copies it into its private `activeEpisodeIsLive`.
- `RadioStation` field names copy the external Radio Browser JSON exactly
  (snake_case and lowercase). Renaming them breaks API deserialization and
  stored favorites.

## Side Effects

- None (type-only module).

## Verification

- Run: `bunx nx test wavely --testPathPatterns=src/app/core`
