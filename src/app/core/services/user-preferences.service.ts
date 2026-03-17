import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

import { RadioStation } from '../models/radio-station.model';

const PREFS_KEY = 'wavely:prefs';

interface WavelyPreferences {
  autoQueueEnabled: boolean;
  favoriteStations: RadioStation[];
}

const DEFAULTS: WavelyPreferences = {
  autoQueueEnabled: true,
  favoriteStations: [],
};

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly autoQueueEnabled = signal<boolean>(this.load().autoQueueEnabled);
  readonly favoriteStations = signal<RadioStation[]>(this.load().favoriteStations);

  /** Legacy IDs (string[]) found in old localStorage format — radio page migrates these on station load. */
  readonly pendingMigrationIds = signal<string[]>(this.loadLegacyIds());

  setAutoQueueEnabled(value: boolean): void {
    this.autoQueueEnabled.set(value);
    this.persist({ autoQueueEnabled: value });
  }

  toggleFavorite(station: RadioStation): void {
    const current = this.favoriteStations();
    const next = current.some((s) => s.stationuuid === station.stationuuid)
      ? current.filter((s) => s.stationuuid !== station.stationuuid)
      : [...current, station];

    this.favoriteStations.set(next);
    this.persist({ favoriteStations: next });
  }

  isFavorite(stationuuid: string): boolean {
    return this.favoriteStations().some((s) => s.stationuuid === stationuuid);
  }

  /** Called by RadioPage after loading stations — migrates any legacy ID-only favorites. */
  migrateLegacyFavorites(loadedStations: RadioStation[]): void {
    const pendingIds = this.pendingMigrationIds();
    if (pendingIds.length === 0) return;

    const toMigrate = loadedStations.filter(
      (s) => pendingIds.includes(s.stationuuid) && !this.isFavorite(s.stationuuid),
    );
    if (toMigrate.length === 0) {
      this.pendingMigrationIds.set([]);
      return;
    }

    const merged = [...this.favoriteStations(), ...toMigrate];
    this.favoriteStations.set(merged);
    this.pendingMigrationIds.set([]);
    this.persist({ favoriteStations: merged });
  }

  private loadLegacyIds(): string[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const hasNew = Array.isArray(parsed.favoriteStations) && parsed.favoriteStations.length > 0;
      const hasLegacy = Array.isArray(parsed.favoriteStationIds) && parsed.favoriteStationIds.length > 0;
      return !hasNew && hasLegacy ? (parsed.favoriteStationIds as string[]) : [];
    } catch {
      return [];
    }
  }

  private load(): WavelyPreferences {
    if (!isPlatformBrowser(this.platformId)) return { ...DEFAULTS };

    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return {
        autoQueueEnabled: parsed.autoQueueEnabled ?? DEFAULTS.autoQueueEnabled,
        // Migrate legacy favoriteStationIds (string[]) — drop them, objects not available
        favoriteStations: Array.isArray(parsed.favoriteStations) ? parsed.favoriteStations : [],
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private persist(patch: Partial<WavelyPreferences>): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const current: WavelyPreferences = {
        autoQueueEnabled: this.autoQueueEnabled(),
        favoriteStations: this.favoriteStations(),
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }
}
