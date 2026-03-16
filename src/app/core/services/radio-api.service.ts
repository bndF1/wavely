import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { RadioStation } from '../models/radio-station.model';
import { Episode } from '../models/podcast.model';

/**
 * Maps a RadioStation to an Episode-compatible object with isLive: true.
 * This allows the existing PlayerStore and AudioService to stream radio stations
 * without any changes — only the player UI adapts based on isLive.
 */
export function radioStationToEpisode(station: RadioStation): Episode & { isLive: true } {
  return {
    id: `radio:${station.stationuuid}`,
    podcastId: `radio:${station.stationuuid}`,
    title: station.name,
    description: [
      station.tags ? `Tags: ${station.tags}` : '',
      station.bitrate ? `${station.bitrate} kbps ${station.codec}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    audioUrl: station.url_resolved,
    imageUrl: station.favicon || undefined,
    podcastTitle: station.countrycode.toUpperCase(),
    duration: 0,
    releaseDate: new Date().toISOString(),
    isLive: true,
  };
}

// Radio Browser API — free, no auth required.
// DNS round-robins to a healthy server in the cluster.
const API_BASE = 'https://all.api.radio-browser.info/json';

@Injectable({ providedIn: 'root' })
export class RadioApiService {
  private readonly http = inject(HttpClient);

  /** Fetch top stations for a given ISO 3166-1 alpha-2 country code, sorted by votes. */
  getStationsByCountry(countryCode: string, limit = 100): Observable<RadioStation[]> {
    const params = new HttpParams()
      .set('countrycode', countryCode.toUpperCase())
      .set('hidebroken', 'true')
      .set('order', 'votes')
      .set('reverse', 'true')
      .set('limit', String(limit));

    return this.http
      .get<RadioStation[]>(`${API_BASE}/stations/bycountrycodeexact/${countryCode.toUpperCase()}`, { params });
  }

  /** Search stations by name or tag. */
  searchStations(query: string, limit = 30): Observable<RadioStation[]> {
    const params = new HttpParams()
      .set('name', query)
      .set('hidebroken', 'true')
      .set('order', 'votes')
      .set('reverse', 'true')
      .set('limit', String(limit));

    return this.http
      .get<RadioStation[]>(`${API_BASE}/stations/search`, { params });
  }

  /**
   * Register a click on a station — required by Radio Browser API ToS.
   * Failures are silently swallowed; this is a best-effort call.
   */
  registerClick(stationuuid: string): Observable<void> {
    return this.http
      .get<unknown>(`${API_BASE}/url/${stationuuid}`)
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined))
      );
  }
}
