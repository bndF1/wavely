import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const PREFS_KEY = 'wavely:prefs';

interface WavelyPreferences {
  autoQueueEnabled: boolean;
  favoriteStationIds: string[];
}

const DEFAULTS: WavelyPreferences = {
  autoQueueEnabled: true,
  favoriteStationIds: [],
};

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly autoQueueEnabled = signal<boolean>(this.load().autoQueueEnabled);
  readonly favoriteStationIds = signal<string[]>(this.load().favoriteStationIds);

  setAutoQueueEnabled(value: boolean): void {
    this.autoQueueEnabled.set(value);
    this.persist({ autoQueueEnabled: value });
  }

  toggleFavorite(stationuuid: string): void {
    const currentIds = this.favoriteStationIds();
    const nextIds = currentIds.includes(stationuuid)
      ? currentIds.filter((id) => id !== stationuuid)
      : [...currentIds, stationuuid];

    this.favoriteStationIds.set(nextIds);
    this.persist({ favoriteStationIds: nextIds });
  }

  isFavorite(stationuuid: string): boolean {
    return this.favoriteStationIds().includes(stationuuid);
  }

  private load(): WavelyPreferences {
    if (!isPlatformBrowser(this.platformId)) return { ...DEFAULTS };

    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private persist(patch: Partial<WavelyPreferences>): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const current: WavelyPreferences = {
        autoQueueEnabled: this.autoQueueEnabled(),
        favoriteStationIds: this.favoriteStationIds(),
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }
}
