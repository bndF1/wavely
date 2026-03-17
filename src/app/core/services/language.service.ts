import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

export interface SupportedLanguage {
  code: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private static readonly STORAGE_KEY = 'wavely:language';

  readonly supported: SupportedLanguage[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);

  readonly current = signal<string>('en');

  constructor() {
    this.translate.setDefaultLang('en');
    const lang = this.resolveInitialLanguage();
    this.current.set(lang);
    this.translate.use(lang);
  }

  setLanguage(code: string): void {
    if (!this.supported.some((l) => l.code === code)) return;
    this.current.set(code);
    this.translate.use(code);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(LanguageService.STORAGE_KEY, code);
      } catch {
        // ignore storage errors
      }
    }
  }

  private resolveInitialLanguage(): string {
    if (!isPlatformBrowser(this.platformId)) return 'en';
    try {
      const saved = localStorage.getItem(LanguageService.STORAGE_KEY);
      if (saved && this.supported.some((l) => l.code === saved)) return saved;
    } catch {
      // ignore storage errors
    }
    const browser = navigator.language.split('-')[0].toLowerCase();
    return this.supported.some((l) => l.code === browser) ? browser : 'en';
  }
}
