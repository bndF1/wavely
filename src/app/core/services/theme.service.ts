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
        localStorage.setItem(ThemeService.STORAGE_KEY, this.mode());
      }
    });
  }

  setMode(mode: ThemeMode): void {
    const valid: ThemeMode[] = ['system', 'light', 'dark'];
    if (!valid.includes(mode)) return;
    this.mode.set(mode);
  }

  private loadSavedMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'system';
    const saved = localStorage.getItem(ThemeService.STORAGE_KEY);
    return (saved as ThemeMode) ?? 'system';
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
