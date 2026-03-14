import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Podcast, Episode } from '../models/podcast.model';

// Maps BCP-47 language-only codes (no region) to best-guess country codes.
const LANGUAGE_COUNTRY_MAP: Record<string, string> = {
  en: 'us', es: 'es', fr: 'fr', de: 'de', it: 'it', pt: 'br',
  ja: 'jp', ko: 'kr', zh: 'cn', ar: 'sa', ru: 'ru', nl: 'nl',
  sv: 'se', nb: 'no', da: 'dk', fi: 'fi', pl: 'pl', tr: 'tr',
  hi: 'in', sw: 'ke', ms: 'my',
};

// Uses iTunes Search API (no key required) as primary data source.
@Injectable({ providedIn: 'root' })
export class PodcastApiService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly itunesBase = 'https://itunes.apple.com';

  /**
   * Detect the user's country from the browser locale.
   * Returns an ISO 3166-1 alpha-2 lowercase country code (e.g. "es", "us").
   * Falls back to "us" in SSR or when locale is unknown.
   */
  detectCountry(): string {
    if (!isPlatformBrowser(this.platformId)) return 'us';

    const locale = navigator.language || 'en-US';
    const base = locale.split('-u-')[0];
    const parts = base.split('-');

    for (let i = 1; i < parts.length; i++) {
      if (/^[A-Za-z]{2}$/.test(parts[i])) {
        return parts[i].toLowerCase();
      }
    }

    const language = parts[0]?.toLowerCase() ?? 'en';
    return LANGUAGE_COUNTRY_MAP[language] ?? 'us';
  }

  searchPodcasts(term: string, country?: string): Observable<Podcast[]> {
    let params = new HttpParams()
      .set('term', term)
      .set('media', 'podcast')
      .set('entity', 'podcast')
      .set('limit', '50');
    if (country) {
      params = params.set('country', country);
    }
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
   * @param country ISO 3166-1 alpha-2 country code. Defaults to detected locale country.
   */
  getTrendingPodcasts(limit = 25, genreId?: number, country?: string): Observable<Podcast[]> {
    const countryCode = country ?? this.detectCountry();
    const genrePath = genreId ? `/genre/${genreId}` : '';
    const url = `${this.itunesBase}/${countryCode}/rss/toppodcasts/limit=${limit}${genrePath}/json`;
    return this.http
      .get<ItunesRssFeed>(url)
      .pipe(map((feed) => feed.feed.entry.map(this.mapRssEntry)));
  }

  /**
   * Fetch all podcasts published by a given iTunes artist/publisher.
   * Returns up to 100 podcasts sorted by iTunes default ranking.
   */
  getPublisherPodcasts(artistId: string): Observable<Podcast[]> {
    const params = new HttpParams()
      .set('id', artistId)
      .set('entity', 'podcast')
      .set('limit', '100');
    return this.http
      .get<{ results: Array<ItunesPodcast | ItunesArtistResult> }>(`${this.itunesBase}/lookup`, { params })
      .pipe(
        map((res) =>
          res.results
            .filter((r): r is ItunesPodcast => r.wrapperType === 'collection')
            .map(this.mapItunesPodcast)
        )
      );
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
      artistId: raw.artistId != null ? String(raw.artistId) : undefined,
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
  wrapperType: 'collection';
  collectionId: number;
  collectionName: string;
  collectionCensoredName?: string;
  artistName: string;
  artistId?: number;
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

interface ItunesArtistResult {
  wrapperType: 'artist';
  artistId: number;
  artistName: string;
}
