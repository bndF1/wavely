import { Episode, Podcast } from '../app/core/models/podcast.model';

let _podcastCounter = 0;
let _episodeCounter = 0;

export function mockPodcast(overrides: Partial<Podcast> = {}): Podcast {
  const id = String(++_podcastCounter);
  return {
    id,
    title: `Podcast ${id}`,
    author: `Author ${id}`,
    description: `Description for podcast ${id}`,
    artworkUrl: `https://example.com/artwork${id}.jpg`,
    feedUrl: `https://example.com/feed${id}.xml`,
    genres: ['Technology'],
    episodeCount: 10,
    latestReleaseDate: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function mockEpisode(overrides: Partial<Episode> = {}): Episode {
  const id = String(++_episodeCounter);
  return {
    id,
    podcastId: '1',
    title: `Episode ${id}`,
    description: `Description for episode ${id}`,
    audioUrl: `https://example.com/audio${id}.mp3`,
    imageUrl: `https://example.com/image${id}.jpg`,
    duration: 3600,
    releaseDate: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function resetCounters(): void {
  _podcastCounter = 0;
  _episodeCounter = 0;
}
