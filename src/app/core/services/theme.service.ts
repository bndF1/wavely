import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Manages app-wide color scheme preference.
 * Persists to localStorage and applies the `ion-palette-dark` class to <html>.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'wavely:theme';

  readonly mode = signal<ThemeMode>(this.loadSavedMode());

  constructor() {
    effect(() => {
      this.applyTheme(this.mode());
      localStorage.setItem(ThemeService.STORAGE_KEY, this.mode());
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  private loadSavedMode(): ThemeMode {
    const saved = localStorage.getItem(ThemeService.STORAGE_KEY);
    return (saved as ThemeMode) ?? 'system';
  }

  private applyTheme(mode: ThemeMode): void {
    const html = document.documentElement;
    if (mode === 'dark') {
      html.classList.add('ion-palette-dark');
    } else if (mode === 'light') {
      html.classList.remove('ion-palette-dark');
    } else {
      // system: follow prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('ion-palette-dark', prefersDark);
    }
  }
}
