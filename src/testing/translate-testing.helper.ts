import { Provider } from '@angular/core';
import {
  provideTranslateService,
  TranslateLoader,
  TranslateNoOpLoader,
  TranslateService,
} from '@ngx-translate/core';

/**
 * Minimal translate setup for unit tests.
 * Provides TranslateService with English translations so templates render
 * readable strings instead of raw i18n keys.
 */
export function provideTranslateTesting(): Provider[] {
  return [
    ...provideTranslateService({
      fallbackLang: 'en',
      loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
    }),
  ];
}

/**
 * Call in beforeEach after TestBed is configured to inject translations.
 * Usage:
 *   const translateService = TestBed.inject(TranslateService);
 *   loadTranslations(translateService);
 */
export function loadTranslations(translate: TranslateService): void {
  translate.setTranslation('en', {
    nav: { home: 'Home', discover: 'Discover', radio: 'Radio', library: 'Library' },
    home: {
      title: 'Wavely',
      my_podcasts: 'My Podcasts',
      latest_episodes: 'Latest Episodes',
      trending: 'Trending',
      load_more: 'Load {{count}} more episodes',
    },
    offline: {
      message: 'You are offline. Some content may be unavailable.',
      dismiss: 'Dismiss offline warning',
    },
    player: {
      play: 'Play',
      pause: 'Pause',
      skip_back: 'Skip back 30 seconds',
      skip_forward: 'Skip forward 30 seconds',
      live: 'LIVE',
      up_next: 'Up Next',
      empty_queue: 'No episodes in queue',
      close: 'Close player',
      add_to_queue: 'Add to queue',
      queue: 'Queue',
    },
    episode: { play: 'Play episode', add_to_queue: 'Add to queue' },
    podcast_detail: {
      subscribe: 'Subscribe',
      unsubscribe: 'Unsubscribe',
      subscribed: 'Subscribed',
      episodes: 'Episodes',
    },
  });
  translate.use('en');
}
