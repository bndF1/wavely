import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { PodcastApiService } from './podcast-api.service';

export interface PodcastMarket {
  code: string;
  name: string;
}

export const PODCAST_MARKETS: PodcastMarket[] = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'au', name: 'Australia' },
  { code: 'ca', name: 'Canada' },
  { code: 'ie', name: 'Ireland' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'za', name: 'South Africa' },
  { code: 'es', name: 'Spain' },
  { code: 'mx', name: 'Mexico' },
  { code: 'ar', name: 'Argentina' },
  { code: 'cl', name: 'Chile' },
  { code: 'co', name: 'Colombia' },
  { code: 'fr', name: 'France' },
  { code: 'be', name: 'Belgium' },
  { code: 'de', name: 'Germany' },
  { code: 'at', name: 'Austria' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'it', name: 'Italy' },
  { code: 'br', name: 'Brazil' },
  { code: 'pt', name: 'Portugal' },
  { code: 'jp', name: 'Japan' },
  { code: 'kr', name: 'South Korea' },
  { code: 'cn', name: 'China' },
  { code: 'in', name: 'India' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'se', name: 'Sweden' },
  { code: 'no', name: 'Norway' },
  { code: 'dk', name: 'Denmark' },
  { code: 'fi', name: 'Finland' },
  { code: 'pl', name: 'Poland' },
  { code: 'ru', name: 'Russia' },
  { code: 'tr', name: 'Turkey' },
];

@Injectable({ providedIn: 'root' })
export class CountryService {
  private static readonly STORAGE_KEY = 'wavely:country';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(PodcastApiService);

  readonly country = signal<string>(this.initCountry());

  private initCountry(): string {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(CountryService.STORAGE_KEY);
      if (saved) {
        const normalized = saved.toLowerCase();
        if (/^[a-z]{2}$/.test(normalized)) return normalized;
      }
    }
    return this.api.detectCountry();
  }

  setCountry(code: string): void {
    const normalized = code.toLowerCase();
    if (!/^[a-z]{2}$/.test(normalized)) return;
    this.country.set(normalized);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(CountryService.STORAGE_KEY, normalized);
    }
  }

  getFlag(code: string): string {
    if (!/^[a-z]{2}$/.test(code)) return '🌍';
    return code
      .split('')
      .map((c) => String.fromCodePoint(c.charCodeAt(0) - 97 + 0x1f1e6))
      .join('');
  }
}
