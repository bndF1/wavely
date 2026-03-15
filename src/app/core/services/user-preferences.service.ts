import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const PREFS_KEY = 'wavely:prefs';

interface WavelyPreferences {
  autoQueueEnabled: boolean;
}

const DEFAULTS: WavelyPreferences = {
  autoQueueEnabled: true,
};

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly autoQueueEnabled = signal<boolean>(this.load().autoQueueEnabled);

  setAutoQueueEnabled(value: boolean): void {
    this.autoQueueEnabled.set(value);
    this.persist({ autoQueueEnabled: value });
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
      const current = this.load();
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }
}
