import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'wavely:theme';

function setupMatchMedia(prefersDark = false): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('ion-palette-dark', 'force-light-theme');
    setupMatchMedia(false);
  });

  afterEach(() => TestBed.resetTestingModule());

  function createService(): ThemeService {
    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    return TestBed.inject(ThemeService);
  }

  describe('initialisation', () => {
    it('defaults to "system" when no value is saved', () => {
      const service = createService();
      expect(service.mode()).toBe('system');
    });

    it('restores saved mode from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      const service = createService();
      expect(service.mode()).toBe('dark');
    });
  });

  describe('setMode()', () => {
    it('"dark" adds ion-palette-dark class to <html>', () => {
      const service = createService();
      service.setMode('dark');
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
      expect(document.documentElement.classList.contains('force-light-theme')).toBe(false);
    });

    it('"light" removes ion-palette-dark and adds force-light-theme to <html>', () => {
      document.documentElement.classList.add('ion-palette-dark');
      const service = createService();
      service.setMode('light');
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
      expect(document.documentElement.classList.contains('force-light-theme')).toBe(true);
    });

    it('"system" removes force-light-theme when switching back from light', () => {
      const service = createService();
      service.setMode('light');
      TestBed.flushEffects();
      service.setMode('system');
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('force-light-theme')).toBe(false);
    });

    it('"system" adds class when prefers-color-scheme is dark', () => {
      setupMatchMedia(true);
      const service = createService();
      service.setMode('light'); // first switch away
      TestBed.flushEffects();
      service.setMode('system');
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
    });

    it('"system" removes class when prefers-color-scheme is light', () => {
      setupMatchMedia(false);
      document.documentElement.classList.add('ion-palette-dark');
      const service = createService();
      service.setMode('system');
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('persists the chosen mode to localStorage', () => {
      const service = createService();
      service.setMode('dark');
      TestBed.flushEffects();
      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('overwrites previously saved mode', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      const service = createService();
      service.setMode('light');
      TestBed.flushEffects();
      expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    });
  });
});
