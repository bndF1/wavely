import { inject, Injectable, PLATFORM_ID, effect, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PlayerStore } from '../../store/player/player.store';

/**
 * AudioService
 *
 * Owns the single HTMLAudioElement for the app.
 * Reacts to PlayerStore signals to drive playback,
 * and feeds progress/duration/ended events back into the store.
 *
 * SSR-safe: audio element is only created in browser context.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly store = inject(PlayerStore);
  private readonly platformId = inject(PLATFORM_ID);

  private audio: HTMLAudioElement | null = null;

  /**
   * True while the service is programmatically seeking the audio element.
   * Prevents the timeupdate handler from overwriting the seek target.
   */
  private seeking = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.wireEvents();

    // Load new episode when currentEpisode changes
    effect(() => {
      const episode = this.store.currentEpisode();
      untracked(() => {
        if (!this.audio) return;
        // Reset seeking flag — a source swap cancels any in-flight seek
        this.seeking = false;
        if (episode) {
          this.audio.src = episode.audioUrl;
          this.audio.load();
          // If already in "playing" state, play() after load.
          // This handles playNext() advancing to next episode while isPlaying stays true.
          if (this.store.isPlaying()) {
            this.audio.play().catch((err) => {
              console.error('[AudioService] auto-play on episode change failed:', err);
              this.store.pause();
            });
          }
        } else {
          this.audio.src = '';
          this.audio.load();
        }
      });
    });

    // Drive play / pause
    effect(() => {
      const playing = this.store.isPlaying();
      untracked(() => {
        if (!this.audio) return;
        if (playing) {
          this.audio.play().catch((err) => {
            console.error('[AudioService] play() failed:', err);
            this.store.pause();
          });
        } else {
          this.audio.pause();
        }
      });
    });

    // Sync playback rate
    effect(() => {
      const rate = this.store.playbackRate();
      untracked(() => {
        if (this.audio) this.audio.playbackRate = rate;
      });
    });

    // Respond to user-initiated seeks (store.seek() jumps > 1 second)
    effect(() => {
      const storeTime = this.store.currentTime();
      untracked(() => {
        if (!this.audio || this.seeking) return;
        const diff = Math.abs(this.audio.currentTime - storeTime);
        if (diff > 1) {
          this.seeking = true;
          this.audio.currentTime = storeTime;
          // seeking flag reset in 'seeked' event handler
        }
      });
    });
  }

  private wireEvents(): void {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => {
      if (this.seeking || !this.audio) return;
      this.store.updateProgress(
        this.audio.currentTime,
        isFinite(this.audio.duration) ? this.audio.duration : 0
      );
    });

    this.audio.addEventListener('durationchange', () => {
      if (!this.audio) return;
      const dur = isFinite(this.audio.duration) ? this.audio.duration : 0;
      this.store.updateProgress(this.audio.currentTime, dur);
    });

    this.audio.addEventListener('seeked', () => {
      this.seeking = false;
    });

    // Safety net: reset seeking on any event that cancels an in-flight seek
    const resetSeeking = (): void => { this.seeking = false; };
    this.audio.addEventListener('abort', resetSeeking);
    this.audio.addEventListener('emptied', resetSeeking);

    this.audio.addEventListener('ended', () => {
      this.store.playNext();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('[AudioService] playback error:', e);
      this.store.pause();
    });
  }

  /** Format seconds → mm:ss or h:mm:ss */
  static formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
