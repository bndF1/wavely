import { inject, Injectable, PLATFORM_ID, effect, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PlayerStore } from '../../store/player/player.store';
import { AuthStore } from '../../store/auth/auth.store';
import { ProgressSyncService } from './progress-sync.service';
import { Episode } from '../models/podcast.model';

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
  private readonly authStore = inject(AuthStore);
  private readonly progressSync = inject(ProgressSyncService);
  private readonly platformId = inject(PLATFORM_ID);

  private audio: HTMLAudioElement | null = null;

  /**
   * True while the service is programmatically seeking the audio element.
   * Prevents the timeupdate handler from overwriting the seek target.
   */
  private seeking = false;

  /** Position fetched from Firestore, waiting to be applied once metadata loads. */
  private pendingRestorePosition: number | null = null;
  /** Set to true by loadedmetadata — used to decide whether to seek immediately. */
  private metadataLoaded = false;

  /**
   * Tracks which episode is actually loaded in the HTMLAudioElement.
   * Updated only when audio.src is set — NOT read from the store in DOM event handlers,
   * because the store's currentEpisode() may advance to the next episode before audio.src
   * is updated (the effect runs asynchronously), causing timeupdate to write the old
   * timestamp under the new episode's ID.
   */
  private activeEpisodeId: string | null = null;

  private static readonly MEDIA_SESSION_POSITION_UPDATE_MS = 5000;
  private lastMediaSessionPositionUpdateMs = 0;
  private mediaSessionHandlersRegistered = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.wireEvents();
    this.setupMediaSession();

    // Load new episode when currentEpisode changes
    effect(() => {
      const episode = this.store.currentEpisode();
      untracked(() => {
        if (!this.audio) return;
        // Reset state for new episode
        this.seeking = false;
        this.pendingRestorePosition = null;
        this.metadataLoaded = false;
        this.lastMediaSessionPositionUpdateMs = 0;

        if (episode) {
          // Flush any pending progress write for the previous episode
          this.progressSync.flush();

          this.audio.src = episode.audioUrl;
          // Update activeEpisodeId AFTER setting src — DOM event handlers must use
          // this field, not store.currentEpisode(), to avoid writing timestamps to
          // a new episode ID before audio.src has been updated.
          this.activeEpisodeId = episode.id;
          this.audio.load();
          this.updateMediaSession(episode);

          // Asynchronously load saved position; apply it once metadata is ready
          const episodeId = episode.id;
          const uid = this.authStore.user()?.uid ?? null;
          this.progressSync.loadProgress(episodeId, uid).then((savedPosition) => {
            // Guard: discard if the episode changed while fetch was in-flight
            if (this.store.currentEpisode()?.id !== episodeId) return;
            if (savedPosition <= 1) return;

            if (this.metadataLoaded) {
              // Metadata already arrived — seek immediately
              this.seeking = true;
              this.audio!.currentTime = savedPosition;
            } else {
              // Metadata not yet loaded — defer to loadedmetadata handler
              this.pendingRestorePosition = savedPosition;
            }
          });

          // If already in "playing" state, play() after load.
          // This handles playNext() advancing to next episode while isPlaying stays true.
          if (this.store.isPlaying()) {
            this.audio.play().catch((err) => {
              console.error('[AudioService] auto-play on episode change failed:', err);
              this.store.pause();
            });
          }
        } else {
          this.progressSync.flush();
          this.activeEpisodeId = null;
          this.audio.src = '';
          this.audio.load();
          this.updateMediaSession(null);
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

  // ---------------------------------------------------------------------------
  // Media Session API — lockscreen / notification controls
  // ---------------------------------------------------------------------------

  private getMediaSession(): MediaSession | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (typeof navigator === 'undefined') return null;
    if (!('mediaSession' in navigator)) return null;
    return navigator.mediaSession;
  }

  private setupMediaSession(): void {
    const mediaSession = this.getMediaSession();
    if (!mediaSession || this.mediaSessionHandlersRegistered) return;

    mediaSession.setActionHandler('play', () => this.store.resume());
    mediaSession.setActionHandler('pause', () => this.store.pause());
    mediaSession.setActionHandler('seekbackward', (details) =>
      this.store.skipBack(details.seekOffset ?? 15)
    );
    mediaSession.setActionHandler('seekforward', (details) =>
      this.store.skipForward(details.seekOffset ?? 30)
    );
    mediaSession.setActionHandler('previoustrack', () => {
      if (this.store.currentTime() > 5) {
        this.store.seek(0);
      }
    });
    mediaSession.setActionHandler('nexttrack', () => this.store.playNext());

    this.mediaSessionHandlersRegistered = true;
  }

  private updateMediaSession(episode: Episode | null): void {
    const mediaSession = this.getMediaSession();
    if (!mediaSession) return;

    if (!episode) {
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
      return;
    }

    mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: episode.podcastId,
      artwork: episode.imageUrl
        ? [{ src: episode.imageUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }

  private updateMediaSessionPlaybackState(playing: boolean): void {
    const mediaSession = this.getMediaSession();
    if (!mediaSession) return;
    mediaSession.playbackState = playing ? 'playing' : 'paused';
  }

  private updateMediaSessionPositionState(): void {
    const mediaSession = this.getMediaSession();
    if (!mediaSession) return;

    const duration = this.store.duration();
    if (duration <= 0) return;
    if (typeof mediaSession.setPositionState !== 'function') return;

    const now = Date.now();
    if (now - this.lastMediaSessionPositionUpdateMs < AudioService.MEDIA_SESSION_POSITION_UPDATE_MS) {
      return;
    }

    this.lastMediaSessionPositionUpdateMs = now;

    try {
      mediaSession.setPositionState({
        duration,
        playbackRate: this.store.playbackRate(),
        position: this.store.currentTime(),
      });
    } catch {
      // setPositionState throws if duration/position is invalid — ignore silently
    }
  }

  private wireEvents(): void {

    this.audio.addEventListener('loadedmetadata', () => {
      this.metadataLoaded = true;
      if (this.pendingRestorePosition !== null && this.pendingRestorePosition > 1) {
        this.seeking = true;
        this.audio!.currentTime = this.pendingRestorePosition;
        this.pendingRestorePosition = null;
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.seeking || !this.audio) return;
      const currentTime = this.audio.currentTime;
      const duration = isFinite(this.audio.duration) ? this.audio.duration : 0;
      this.store.updateProgress(currentTime, duration);
      if (this.store.isPlaying()) {
        this.updateMediaSessionPositionState();
      }
      // Throttled Firestore write during playback
      const uid = this.authStore.user()?.uid ?? null;
      // Use activeEpisodeId (not store) — store.currentEpisode() may already reflect
      // the next episode while audio.src still plays the previous one.
      const episodeId = this.activeEpisodeId;
      if (episodeId) {
        this.progressSync.scheduleWrite(
          episodeId,
          currentTime,
          duration,
          uid
        );
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (!this.audio) return;
      const dur = isFinite(this.audio.duration) ? this.audio.duration : 0;
      this.store.updateProgress(this.audio.currentTime, dur);
    });

    this.audio.addEventListener('play', () => {
      this.updateMediaSessionPlaybackState(true);
    });

    this.audio.addEventListener('pause', () => {
      this.updateMediaSessionPlaybackState(false);
      // Flush progress on any pause (user-initiated or programmatic).
      // Use activeEpisodeId — same race reason as timeupdate handler.
      const uid = this.authStore.user()?.uid ?? null;
      const episodeId = this.activeEpisodeId;
      if (episodeId && this.audio) {
        this.progressSync.scheduleWrite(
          episodeId,
          this.audio.currentTime,
          isFinite(this.audio.duration) ? this.audio.duration : 0,
          uid
        );
        this.progressSync.flush();
      }
    });

    this.audio.addEventListener('seeked', () => {
      this.seeking = false;
    });

    // Safety net: reset seeking on any event that cancels an in-flight seek
    const resetSeeking = (): void => { this.seeking = false; };
    this.audio.addEventListener('abort', resetSeeking);
    this.audio.addEventListener('emptied', resetSeeking);

    this.audio.addEventListener('ended', () => {
      const uid = this.authStore.user()?.uid ?? null;
      const episodeId = this.activeEpisodeId;
      const duration = this.store.duration();
      if (episodeId) {
        this.progressSync.markCompleted(episodeId, duration, uid);
      }
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
