import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PodcastApiService } from './podcast-api.service';
import { CountryService } from './country.service';

describe('CountryService', () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  function setup(platformId: string, savedCountry: string | null, detectedCountry = 'es') {
    getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key) => (key === 'wavely:country' ? savedCountry : null));
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        {
          provide: PodcastApiService,
          useValue: { detectCountry: jest.fn().mockReturnValue(detectedCountry) },
        },
      ],
    });

    return TestBed.inject(CountryService);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('uses saved localStorage value on browser', () => {
      const svc = setup('browser', 'gb');
      expect(svc.country()).toBe('gb');
      expect(getItemSpy).toHaveBeenCalledWith('wavely:country');
    });

    it('falls back to detectCountry when nothing is saved', () => {
      const svc = setup('browser', null);
      expect(svc.country()).toBe('es');
    });

    it('falls back to detectCountry in SSR without touching localStorage', () => {
      const svc = setup('server', null);
      expect(svc.country()).toBe('es');
      expect(getItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('setCountry', () => {
    it('updates the signal', () => {
      const svc = setup('browser', null);
      svc.setCountry('de');
      expect(svc.country()).toBe('de');
    });

    it('persists to localStorage on browser', () => {
      const svc = setup('browser', null);
      svc.setCountry('de');
      expect(setItemSpy).toHaveBeenCalledWith('wavely:country', 'de');
    });

    it('does not call localStorage in SSR', () => {
      const svc = setup('server', null);
      svc.setCountry('de');
      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('getFlag', () => {
    it('returns correct emoji flag for valid 2-letter codes', () => {
      const svc = setup('browser', null);
      expect(svc.getFlag('us')).toBe('🇺🇸');
      expect(svc.getFlag('gb')).toBe('🇬🇧');
      expect(svc.getFlag('de')).toBe('🇩🇪');
    });

    it('returns 🌍 for invalid or unknown codes', () => {
      const svc = setup('browser', null);
      expect(svc.getFlag('xyz')).toBe('🌍');
      expect(svc.getFlag('')).toBe('🌍');
    });
  });
});
