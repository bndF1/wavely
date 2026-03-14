import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PodcastApiService } from './podcast-api.service';

describe('PodcastApiService', () => {
  let service: PodcastApiService;
  let httpMock: HttpTestingController;

  const ITUNES_BASE = 'https://itunes.apple.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PodcastApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PodcastApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('searchPodcasts()', () => {
    it('requests iTunes search API with correct params', () => {
      service.searchPodcasts('javascript').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${ITUNES_BASE}/search` &&
          r.params.get('term') === 'javascript' &&
          r.params.get('media') === 'podcast' &&
          r.params.get('limit') === '50'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ results: [] });
    });

    it('includes country param when provided', () => {
      service.searchPodcasts('music', 'es').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${ITUNES_BASE}/search` && r.params.get('country') === 'es'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ results: [] });
    });

    it('omits country param when not provided', () => {
      service.searchPodcasts('music').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${ITUNES_BASE}/search`);
      expect(req.request.params.has('country')).toBe(false);
      req.flush({ results: [] });
    });

    it('maps iTunes response to Podcast model', () => {
      let results: ReturnType<PodcastApiService['searchPodcasts']> extends import('rxjs').Observable<infer T> ? T : never = [];
      service.searchPodcasts('tech').subscribe((r) => (results = r));

      httpMock
        .expectOne((r) => r.url === `${ITUNES_BASE}/search`)
        .flush({
          results: [
            {
              collectionId: 12345,
              collectionName: 'Tech Podcast',
              artistName: 'Tech Author',
              collectionCensoredName: 'Tech Podcast',
              artworkUrl600: 'https://example.com/art600.jpg',
              artworkUrl100: 'https://example.com/art100.jpg',
              feedUrl: 'https://example.com/feed.xml',
              genres: ['Technology', 'Science'],
              trackCount: 42,
              releaseDate: '2024-01-01T00:00:00Z',
            },
          ],
        });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: '12345',
        title: 'Tech Podcast',
        author: 'Tech Author',
        artworkUrl: 'https://example.com/art600.jpg',
        feedUrl: 'https://example.com/feed.xml',
        genres: ['Technology', 'Science'],
        episodeCount: 42,
      });
    });

    it('falls back to artworkUrl100 when artworkUrl600 is missing', () => {
      let results: { artworkUrl: string }[] = [];
      service.searchPodcasts('tech').subscribe((r) => (results = r));

      httpMock
        .expectOne((r) => r.url === `${ITUNES_BASE}/search`)
        .flush({
          results: [
            {
              collectionId: 1,
              collectionName: 'Pod',
              artistName: 'Author',
              artworkUrl600: undefined,
              artworkUrl100: 'https://example.com/art100.jpg',
              feedUrl: '',
              genres: [],
              trackCount: 1,
              releaseDate: '2024-01-01T00:00:00Z',
            },
          ],
        });

      expect(results[0].artworkUrl).toBe('https://example.com/art100.jpg');
    });

    it('returns empty array when results are empty', () => {
      let results: unknown[] = [];
      service.searchPodcasts('xyz').subscribe((r) => (results = r));
      httpMock
        .expectOne((r) => r.url === `${ITUNES_BASE}/search`)
        .flush({ results: [] });
      expect(results).toEqual([]);
    });
  });

  describe('getPodcastEpisodes()', () => {
    it('filters out non-episode items', () => {
      let episodes: unknown[] = [];
      service.getPodcastEpisodes('999').subscribe((r) => (episodes = r));

      httpMock
        .expectOne((r) => r.url === `${ITUNES_BASE}/lookup`)
        .flush({
          results: [
            // podcast header record — must be filtered out
            { kind: 'podcast', collectionId: 999, trackId: 0, trackName: 'Parent', releaseDate: '' },
            {
              kind: 'podcast-episode',
              trackId: 1,
              collectionId: 999,
              trackName: 'Ep 1',
              description: 'Desc',
              previewUrl: 'https://example.com/ep1.mp3',
              artworkUrl600: 'https://example.com/art.jpg',
              trackTimeMillis: 3600000,
              releaseDate: '2024-01-01T00:00:00Z',
            },
          ],
        });

      expect(episodes).toHaveLength(1);
      expect((episodes[0] as { title: string }).title).toBe('Ep 1');
    });

    it('maps episode duration from milliseconds to seconds', () => {
      let episodes: { duration: number }[] = [];
      service.getPodcastEpisodes('999').subscribe((r) => (episodes = r));

      httpMock
        .expectOne((r) => r.url === `${ITUNES_BASE}/lookup`)
        .flush({
          results: [
            {
              kind: 'podcast-episode',
              trackId: 1,
              collectionId: 999,
              trackName: 'Ep',
              previewUrl: 'https://example.com/ep.mp3',
              trackTimeMillis: 90000,
              releaseDate: '2024-01-01T00:00:00Z',
            },
          ],
        });

      expect(episodes[0].duration).toBe(90);
    });
  });

  describe('getTrendingPodcasts()', () => {
    it('requests the iTunes RSS feed with correct limit', () => {
      service.getTrendingPodcasts(10).subscribe();

      const req = httpMock.expectOne(
        `${ITUNES_BASE}/us/rss/toppodcasts/limit=10/json`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ feed: { entry: [] } });
    });

    it('includes genre path when genreId is provided', () => {
      service.getTrendingPodcasts(5, 1310).subscribe();

      const req = httpMock.expectOne(
        `${ITUNES_BASE}/us/rss/toppodcasts/limit=5/genre/1310/json`
      );
      req.flush({ feed: { entry: [] } });
    });
  });

  describe('detectCountry()', () => {
    const originalLanguage = Object.getOwnPropertyDescriptor(navigator, 'language');

    afterEach(() => {
      if (originalLanguage) {
        Object.defineProperty(navigator, 'language', originalLanguage);
      }
    });

    function setLocale(lang: string): void {
      Object.defineProperty(navigator, 'language', { value: lang, configurable: true });
    }

    it('extracts country from a full BCP-47 locale (e.g. es-ES → es)', () => {
      setLocale('es-ES');
      expect(service.detectCountry()).toBe('es');
    });

    it('extracts country from a locale with language and region (e.g. en-US → us)', () => {
      setLocale('en-US');
      expect(service.detectCountry()).toBe('us');
    });

    it('maps language-only codes via fallback map (e.g. pt → br)', () => {
      setLocale('pt');
      expect(service.detectCountry()).toBe('br');
    });

    it('falls back to "us" for unknown language-only codes', () => {
      setLocale('xx');
      expect(service.detectCountry()).toBe('us');
    });
  });
});
