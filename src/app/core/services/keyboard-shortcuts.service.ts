import { inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PlayerStore } from '../../store/player/player.store';
import { LayoutStore } from '../../store/layout/layout.store';

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService implements OnDestroy {
  private readonly playerStore = inject(PlayerStore);
  private readonly layoutStore = inject(LayoutStore);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly handler = (event: KeyboardEvent): void => {
    // Never fire when user is typing in an input.
    // Guard against non-Element targets (e.g. document node when dispatched to document).
    const target = event.target;
    if (!(target instanceof Element)) return;

    const tag = target.tagName.toLowerCase();
    const isInput =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      // Match any contenteditable state except the explicit opt-out ("false").
      // This covers contenteditable="true", contenteditable="", and bare contenteditable.
      target.closest('[contenteditable]:not([contenteditable="false"])') !== null ||
      target.closest('ion-searchbar') !== null ||
      target.closest('ion-input') !== null;

    if (isInput) return;

    // Don't intercept modifier combos (Ctrl+Z etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    switch (event.key) {
      case ' ':
        // Space: toggle play/pause — but only if an episode is loaded
        if (!this.playerStore.currentEpisode()) return;
        event.preventDefault(); // prevent page scroll
        if (this.playerStore.isPlaying()) {
          this.playerStore.pause();
        } else {
          this.playerStore.resume();
        }
        break;

      case 'j':
        if (!this.playerStore.currentEpisode()) return;
        this.playerStore.skipBack(15);
        break;

      case 'k':
        if (!this.playerStore.currentEpisode()) return;
        this.playerStore.skipForward(30);
        break;

      case '[':
        this.layoutStore.toggleSidebar();
        break;
    }
  };

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    document.addEventListener('keydown', this.handler);
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('keydown', this.handler);
    }
  }
}
