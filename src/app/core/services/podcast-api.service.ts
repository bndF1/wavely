import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Podcast, Episode } from '../models/podcast.model';

// Uses iTunes Search API (no key required) as primary source,
// with Podcast Index API as enhanced fallback once credentials are set.
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

  private mapItunesPodcast(raw: ItunesPodcast): Podcast {
    return {
      id: String(raw.collectionId),
      title: raw.collectionName,
      author: raw.artistName,
      description: '',
      artworkUrl: raw.artworkUrl600 ?? raw.artworkUrl100,
      feedUrl: raw.feedUrl ?? '',
      genres: raw.genres ?? [],
      episodeCount: raw.trackCount,
      latestReleaseDate: raw.releaseDate,
    };
  }
}

interface ItunesPodcast {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl600: string;
  artworkUrl100: string;
  feedUrl: string;
  genres: string[];
  trackCount: number;
  releaseDate: string;
}
