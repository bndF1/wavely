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

  describe('lookupPodcast()', () => {
    const podcastPayload = {
      wrapperType: 'collection',
      collectionId: 12345,
      collectionName: 'Test Podcast',
      collectionCensoredName: 'Test Podcast',
      artistName: 'Test Author',
      artistId: 99,
      artworkUrl600: 'https://example.com/art600.jpg',
      artworkUrl100: 'https://example.com/art100.jpg',
      feedUrl: 'https://example.com/feed.xml',
      genres: ['Tech'],
      trackCount: 50,
      releaseDate: '2024-06-01T00:00:00Z',
    };

    it('calls iTunes lookup with id and maps the result', () => {
      let result: unknown;
      service.lookupPodcast('12345').subscribe((p) => (result = p));

      const req = httpMock.expectOne(
        (r) => r.url === `${ITUNES_BASE}/lookup` && r.params.get('id') === '12345'
      );
      expect(req.request.params.get('country')).toBeNull();
      req.flush({ results: [podcastPayload] });

      expect((result as { id: string }).id).toBe('12345');
      expect((result as { title: string }).title).toBe('Test Podcast');
    });

    it('passes country param when provided', () => {
      let result: unknown;
      service.lookupPodcast('12345', 'es').subscribe((p) => (result = p));

      const req = httpMock.expectOne((r) => r.url === `${ITUNES_BASE}/lookup`);
      expect(req.request.params.get('country')).toBe('es');
      req.flush({ results: [podcastPayload] });

      expect((result as { id: string }).id).toBe('12345');
    });

    it('throws when results array is empty', () => {
      let error: unknown;
      service.lookupPodcast('99999').subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((r) => r.url === `${ITUNES_BASE}/lookup`)
        .flush({ results: [] });

      expect((error as Error).message).toBe('Podcast not found');
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

    it('forwards country param to the iTunes /lookup request', () => {
      service.getPodcastEpisodes('999', 50, 'gb').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${ITUNES_BASE}/lookup`);
      expect(req.request.params.get('country')).toBe('gb');
      req.flush({ results: [] });
    });
  });

  describe('getTrendingPodcasts()', () => {
    function setLocale(lang: string): void {
      Object.defineProperty(navigator, 'language', { value: lang, configurable: true });
    }

    it('uses detected country from locale in URL', () => {
      setLocale('es-ES');
      service.getTrendingPodcasts(10).subscribe();

      const req = httpMock.expectOne(
        `${ITUNES_BASE}/es/rss/toppodcasts/limit=10/json`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ feed: { entry: [] } });
    });

    it('accepts an explicit country override', () => {
      service.getTrendingPodcasts(10, undefined, 'gb').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url.includes('/gb/rss/toppodcasts/limit=10/json')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ feed: { entry: [] } });
    });

    it('includes genre path when genreId is provided', () => {
      service.getTrendingPodcasts(5, 1310, 'us').subscribe();

      const req = httpMock.expectOne(
        `${ITUNES_BASE}/us/rss/toppodcasts/limit=5/genre=1310/json`
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

    it('extracts 2-letter region from a full locale (e.g. es-ES → es)', () => {
      setLocale('es-ES');
      expect(service.detectCountry()).toBe('es');
    });

    it('extracts first 2-letter region even when script is present (e.g. zh-Hans-CN)', () => {
      setLocale('zh-Hans-CN');
      expect(service.detectCountry()).toBe('cn');
    });

    it('ignores unicode extension sequences (e.g. en-US-u-hc-h12)', () => {
      setLocale('en-US-u-hc-h12');
      expect(service.detectCountry()).toBe('us');
    });

    it('falls back to language map for locales without a 2-letter region (e.g. zh-Hans)', () => {
      setLocale('zh-Hans');
      expect(service.detectCountry()).toBe('cn');
    });

    it('falls back to language map for numeric region tags (e.g. es-419)', () => {
      setLocale('es-419');
      expect(service.detectCountry()).toBe('es');
    });

    it('falls back to "us" for unknown language-only codes', () => {
      setLocale('xx');
      expect(service.detectCountry()).toBe('us');
    });
  });

  describe('getPublisherPodcasts()', () => {
    it('calls iTunes lookup with correct params and maps only collection results', () => {
      const artistId = '131600381';
      let result: unknown[] = [];

      service.getPublisherPodcasts(artistId).subscribe((p) => (result = p));

      const req = httpMock.expectOne(
        (r) => r.url === `${ITUNES_BASE}/lookup` && r.params.get('id') === artistId
      );
      expect(req.request.params.get('entity')).toBe('podcast');
      expect(req.request.params.get('limit')).toBe('100');
      expect(req.request.params.get('country')).toBeNull();

      req.flush({
        results: [
          // Artist record — should be filtered out
          { wrapperType: 'artist', artistId: 131600381, artistName: 'Cadena SER' },
          // Podcast collection record — should be mapped
          {
            wrapperType: 'collection',
            collectionId: 100001,
            collectionName: 'Hoy por Hoy',
            artistName: 'Cadena SER',
            artistId: 131600381,
            artworkUrl600: 'https://example.com/art600.jpg',
            artworkUrl100: 'https://example.com/art100.jpg',
            feedUrl: 'https://feeds.ser.es/hpd',
            genres: ['News'],
            trackCount: 200,
            releaseDate: '2024-01-01',
          },
        ],
      });

      expect(result.length).toBe(1);
      expect((result[0] as { id: string }).id).toBe('100001');
      expect((result[0] as { artistId: string }).artistId).toBe('131600381');
    });

    it('passes country param to iTunes lookup when provided', () => {
      let result: unknown[] = [];

      service.getPublisherPodcasts('131600381', 'es').subscribe((p) => (result = p));

      const req = httpMock.expectOne((r) => r.url === `${ITUNES_BASE}/lookup`);
      expect(req.request.params.get('country')).toBe('es');
      req.flush({ results: [] });
      expect(result.length).toBe(0);
    });

    it('returns empty array when only artist result is returned', () => {
      let result: unknown[] = [{ placeholder: true }];

      service.getPublisherPodcasts('999').subscribe((p) => (result = p));

      const req = httpMock.expectOne((r) => r.url === `${ITUNES_BASE}/lookup`);
      req.flush({
        results: [{ wrapperType: 'artist', artistId: 999, artistName: 'Unknown' }],
      });

      expect(result.length).toBe(0);
    });
  });

  describe('getEpisodesFromRss()', () => {
    const FEED_URL = 'https://example.com/feed.xml';
    const PODCAST_ID = 'pod-1';
    const PROXY_URL = `https://corsproxy.io/?${encodeURIComponent(FEED_URL)}`;

    const rssXml = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel><title>Test Podcast</title>${items}</channel>
</rss>`;

    const audioItem = (idx: number) => `
<item>
  <title>Episode ${idx}</title>
  <description>Desc ${idx}</description>
  <pubDate>Mon, 0${idx} Jan 2024 00:00:00 +0000</pubDate>
  <enclosure url="https://example.com/ep${idx}.mp3" type="audio/mpeg" length="1234"/>
  <itunes:duration>1800</itunes:duration>
  <guid>https://example.com/ep${idx}</guid>
</item>`;

    it('returns episodes from direct fetch when RSS allows CORS', () => {
      let result: { title: string }[] = [];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      httpMock
        .expectOne((r) => r.url === FEED_URL)
        .flush(rssXml(audioItem(1) + audioItem(2)));
      httpMock.expectNone((r) => r.url === PROXY_URL);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Episode 1');
      expect(result[1].title).toBe('Episode 2');
    });

    it('falls back to corsproxy.io when direct fetch fails (CORS)', () => {
      let result: { title: string; audioUrl: string }[] = [];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      // Simulate CORS error on direct request
      httpMock.expectOne((r) => r.url === FEED_URL).error(new ProgressEvent('error'));

      // Proxy request succeeds
      httpMock
        .expectOne((r) => r.url === PROXY_URL)
        .flush(rssXml(audioItem(1)));

      expect(result).toHaveLength(1);
      expect(result[0].audioUrl).toBe('https://example.com/ep1.mp3');
    });

    it('returns empty array when both direct fetch and proxy fail', () => {
      let result: unknown[] = [{ placeholder: true }];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      httpMock.expectOne((r) => r.url === FEED_URL).error(new ProgressEvent('error'));
      httpMock.expectOne((r) => r.url === PROXY_URL).error(new ProgressEvent('error'));

      expect(result).toHaveLength(0);
    });

    it('skips items without audio enclosures (e.g. video items)', () => {
      const videoItem = `
<item>
  <title>Video Episode</title>
  <enclosure url="https://example.com/video.mp4" type="video/mp4" length="9999"/>
  <guid>video-1</guid>
</item>`;

      let result: unknown[] = [];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      httpMock.expectOne((r) => r.url === FEED_URL).flush(rssXml(videoItem + audioItem(1)));

      expect(result).toHaveLength(1);
    });

    it('returns empty array for invalid / non-RSS XML', () => {
      let result: unknown[] = [{ placeholder: true }];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      httpMock.expectOne((r) => r.url === FEED_URL).flush('<not>valid rss</not>');

      expect(result).toHaveLength(0);
    });

    it('parses itunes:duration in HH:MM:SS and MM:SS formats', () => {
      const itemHhMmSs = `
<item>
  <title>Long Episode</title>
  <enclosure url="https://example.com/long.mp3" type="audio/mpeg" length="1"/>
  <itunes:duration>1:30:00</itunes:duration>
  <guid>long-1</guid>
</item>`;
      const itemMmSs = `
<item>
  <title>Short Episode</title>
  <enclosure url="https://example.com/short.mp3" type="audio/mpeg" length="1"/>
  <itunes:duration>45:30</itunes:duration>
  <guid>short-1</guid>
</item>`;

      let result: { duration: number }[] = [];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      httpMock.expectOne((r) => r.url === FEED_URL).flush(rssXml(itemHhMmSs + itemMmSs));

      expect(result[0].duration).toBe(5400);  // 1h 30m
      expect(result[1].duration).toBe(2730);  // 45m 30s
    });

    it('maps podcastId to all episodes', () => {
      let result: { podcastId: string }[] = [];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));

      httpMock.expectOne((r) => r.url === FEED_URL).flush(rssXml(audioItem(1)));

      expect(result[0].podcastId).toBe(PODCAST_ID);
    });

    it('uses safe ISO fallback when pubDate is missing or unparseable', () => {
      const badDateItems = `
<item>
  <title>No Date</title>
  <enclosure url="https://example.com/ep-nodate.mp3" type="audio/mpeg" length="1234"/>
  <guid>guid-nodate</guid>
</item>
<item>
  <title>Bad Date</title>
  <pubDate>not-a-real-date</pubDate>
  <enclosure url="https://example.com/ep-baddate.mp3" type="audio/mpeg" length="1234"/>
  <guid>guid-baddate</guid>
</item>`;

      let result: { releaseDate: string }[] = [];
      service.getEpisodesFromRss(FEED_URL, PODCAST_ID).subscribe((eps) => (result = eps));
      httpMock.expectOne((r) => r.url === FEED_URL).flush(rssXml(badDateItems));

      // Both should produce a valid ISO timestamp, never "Invalid Date"
      expect(result).toHaveLength(2);
      result.forEach((ep) => {
        expect(new Date(ep.releaseDate).toISOString()).toBe(ep.releaseDate);
      });
    });
  });
});
