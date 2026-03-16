import { inject, Injectable, PLATFORM_ID, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Manages app-wide color scheme preference.
 * Persists to localStorage and applies the `ion-palette-dark` class to <html>.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'wavely:theme';

  private readonly platformId = inject(PLATFORM_ID);

  readonly mode = signal<ThemeMode>(this.loadSavedMode());

  constructor() {
    effect(() => {
      this.applyTheme(this.mode());
      if (isPlatformBrowser(this.platformId)) {
        try {
          localStorage.setItem(ThemeService.STORAGE_KEY, this.mode());
        } catch {
          // Safari private mode or storage quota exceeded — ignore
        }
      }
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  private loadSavedMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'system';
    try {
      const saved = localStorage.getItem(ThemeService.STORAGE_KEY);
      const valid: ThemeMode[] = ['system', 'light', 'dark'];
      return valid.includes(saved as ThemeMode) ? (saved as ThemeMode) : 'system';
    } catch {
      return 'system';
    }
  }

  private applyTheme(mode: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const html = document.documentElement;
    if (mode === 'dark') {
      html.classList.add('ion-palette-dark');
      html.classList.remove('force-light-theme');
    } else if (mode === 'light') {
      html.classList.remove('ion-palette-dark');
      html.classList.add('force-light-theme');
    } else {
      // system: follow prefers-color-scheme
      html.classList.remove('force-light-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('ion-palette-dark', prefersDark);
    }
  }
}
