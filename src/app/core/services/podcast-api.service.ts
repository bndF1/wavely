import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Podcast, Episode } from '../models/podcast.model';

// Uses iTunes Search API (no key required) as primary data source.
@Injectable({ providedIn: 'root' })
export class PodcastApiService {
  private readonly http = inject(HttpClient);
  private readonly itunesBase = 'https://itunes.apple.com';

  searchPodcasts(term: string): Observable<Podcast[]> {
    const params = new HttpParams()
      .set('term', term)
      .set('media', 'podcast')
      .set('entity', 'podcast')
      .set('limit', '20');
    return this.http
      .get<{ results: ItunesPodcast[] }>(`${this.itunesBase}/search`, { params })
      .pipe(map((res) => res.results.map(this.mapItunesPodcast)));
  }

  lookupPodcast(itunesId: string): Observable<Podcast> {
    const params = new HttpParams().set('id', itunesId).set('entity', 'podcast');
    return this.http
      .get<{ results: ItunesPodcast[] }>(`${this.itunesBase}/lookup`, { params })
      .pipe(map((res) => this.mapItunesPodcast(res.results[0])));
  }

  /**
   * Fetch top podcasts chart via the iTunes RSS feed.
   * @param limit Number of results (max 100). Default 25.
   * @param genreId Optional iTunes genre ID. Omit for overall top chart.
   */
  getTrendingPodcasts(limit = 25, genreId?: number): Observable<Podcast[]> {
    const genrePath = genreId ? `/genre/${genreId}` : '';
    const url = `${this.itunesBase}/us/rss/toppodcasts/limit=${limit}${genrePath}/json`;
    return this.http
      .get<ItunesRssFeed>(url)
      .pipe(map((feed) => feed.feed.entry.map(this.mapRssEntry)));
  }

  /**
   * Fetch episodes for a podcast via iTunes lookup.
   * Returns up to `limit` most recent episodes.
   */
  getPodcastEpisodes(itunesId: string, limit = 50): Observable<Episode[]> {
    const params = new HttpParams()
      .set('id', itunesId)
      .set('entity', 'podcastEpisode')
      .set('limit', String(limit));
    return this.http
      .get<{ results: ItunesEpisodeRaw[] }>(`${this.itunesBase}/lookup`, { params })
      .pipe(
        map((res) =>
          res.results
            .filter((r) => r.kind === 'podcast-episode')
            .map(this.mapItunesEpisode)
        ),
      );
  }

  private mapItunesPodcast(raw: ItunesPodcast): Podcast {
    return {
      id: String(raw.collectionId),
      title: raw.collectionName,
      author: raw.artistName,
      description: raw.collectionCensoredName ?? '',
      artworkUrl: raw.artworkUrl600 ?? raw.artworkUrl100,
      feedUrl: raw.feedUrl ?? '',
      genres: raw.genres ?? [],
      episodeCount: raw.trackCount,
      latestReleaseDate: raw.releaseDate,
    };
  }

  private mapRssEntry(entry: ItunesRssEntry): Podcast {
    const artworkUrl = (entry['im:image']?.at(-1)?.label ?? '')
      .replace(/\/\d+x\d+bb\./, '/600x600bb.');
    const genreAttr = entry.category?.attributes;
    return {
      id: entry.id.attributes['im:id'],
      title: entry['im:name'].label,
      author: entry['im:artist']?.label ?? '',
      description: entry.summary?.label ?? '',
      artworkUrl,
      feedUrl: '',
      genres: genreAttr?.label ? [genreAttr.label] : [],
    };
  }

  private mapItunesEpisode(raw: ItunesEpisodeRaw): Episode {
    return {
      id: String(raw.trackId),
      podcastId: String(raw.collectionId),
      title: raw.trackName,
      description: raw.description ?? '',
      audioUrl: raw.previewUrl ?? '',
      imageUrl: raw.artworkUrl600 ?? raw.artworkUrl160,
      duration: Math.round((raw.trackTimeMillis ?? 0) / 1000),
      releaseDate: raw.releaseDate,
    };
  }
}

interface ItunesPodcast {
  collectionId: number;
  collectionName: string;
  collectionCensoredName?: string;
  artistName: string;
  artworkUrl600: string;
  artworkUrl100: string;
  feedUrl: string;
  genres: string[];
  trackCount: number;
  releaseDate: string;
}

interface ItunesRssEntry {
  'im:name': { label: string };
  'im:artist'?: { label: string };
  'im:image'?: Array<{ label: string; attributes: { height: string } }>;
  id: { label: string; attributes: { 'im:id': string } };
  summary?: { label: string };
  category?: { attributes: { 'im:id': string; term: string; label: string } };
}

interface ItunesRssFeed {
  feed: { entry: ItunesRssEntry[] };
}

interface ItunesEpisodeRaw {
  kind: string;
  trackId: number;
  collectionId: number;
  trackName: string;
  description?: string;
  previewUrl?: string;
  artworkUrl600?: string;
  artworkUrl160?: string;
  trackTimeMillis?: number;
  releaseDate: string;
}
