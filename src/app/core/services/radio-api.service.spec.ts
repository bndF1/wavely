import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { RadioApiService, radioStationToEpisode } from './radio-api.service';
import { RadioStation } from '../models/radio-station.model';

const RADIO_BASE = 'https://all.api.radio-browser.info/json';

const mockStation = (): RadioStation => ({
  stationuuid: 'abc-123',
  name: 'Test FM',
  url_resolved: 'https://stream.testfm.com/live',
  favicon: 'https://testfm.com/logo.png',
  countrycode: 'ES',
  language: 'spanish',
  tags: 'pop,rock',
  votes: 500,
  clickcount: 1000,
  bitrate: 128,
  codec: 'MP3',
});

describe('RadioApiService', () => {
  let service: RadioApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RadioApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RadioApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('getStationsByCountry()', () => {
    it('requests stations with uppercase country code and correct params', () => {
      service.getStationsByCountry('es').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${RADIO_BASE}/stations/bycountrycodeexact/ES` &&
          r.params.get('hidebroken') === 'true' &&
          r.params.get('order') === 'votes' &&
          r.params.get('reverse') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockStation()]);
    });

    it('propagates HTTP errors so callers can show error state', () => {
      let errorCaught = false;
      service.getStationsByCountry('us').subscribe({
        error: () => (errorCaught = true),
      });

      httpMock
        .expectOne((r) => r.url.includes('bycountrycodeexact'))
        .flush('error', { status: 500, statusText: 'Server Error' });

      expect(errorCaught).toBe(true);
    });

    it('uses the provided limit parameter', () => {
      service.getStationsByCountry('de', 10).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url.includes('bycountrycodeexact') && r.params.get('limit') === '10'
      );
      req.flush([]);
    });
  });

  describe('searchStations()', () => {
    it('requests stations search with name and correct defaults', () => {
      service.searchStations('jazz').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${RADIO_BASE}/stations/search` &&
          r.params.get('name') === 'jazz' &&
          r.params.get('hidebroken') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockStation()]);
    });

    it('propagates HTTP errors so callers can show error state', () => {
      let errorCaught = false;
      service.searchStations('jazz').subscribe({
        error: () => (errorCaught = true),
      });

      httpMock
        .expectOne((r) => r.url.includes('/stations/search'))
        .flush('error', { status: 503, statusText: 'Unavailable' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('registerClick()', () => {
    it('calls the click URL for the given station uuid', () => {
      service.registerClick('abc-123').subscribe();

      const req = httpMock.expectOne(`${RADIO_BASE}/url/abc-123`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('completes without error on HTTP failure (best-effort ToS call)', () => {
      let completed = false;
      service.registerClick('abc-123').subscribe({ complete: () => (completed = true) });

      httpMock
        .expectOne(`${RADIO_BASE}/url/abc-123`)
        .flush('error', { status: 500, statusText: 'Error' });

      expect(completed).toBe(true);
    });
  });
});

describe('radioStationToEpisode()', () => {
  const station = mockStation();
  const episode = radioStationToEpisode(station);

  it('sets isLive to true', () => {
    expect(episode.isLive).toBe(true);
  });

  it('uses stationuuid as a namespaced id', () => {
    expect(episode.id).toBe(`radio:${station.stationuuid}`);
  });

  it('maps stream URL to audioUrl', () => {
    expect(episode.audioUrl).toBe(station.url_resolved);
  });

  it('maps favicon to imageUrl', () => {
    expect(episode.imageUrl).toBe(station.favicon);
  });

  it('sets duration to 0 (live has no duration)', () => {
    expect(episode.duration).toBe(0);
  });

  it('sets countrycode (uppercased) as podcastTitle', () => {
    expect(episode.podcastTitle).toBe('ES');
  });
});
