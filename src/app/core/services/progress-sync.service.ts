import { Injectable } from '@angular/core';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

export interface EpisodeProgress {
  episodeId: string;
  position: number;
  duration: number;
  completedAt: number | null;
  updatedAt: number;
}

/**
 * ProgressSyncService
 *
 * Throttled persistence of episode playback position to Firestore.
 * Firestore path: users/{uid}/progress/{episodeId}
 *
 * - Writes are throttled to every 5s during active playback
 * - Always flushes on pause, episode change, and completion
 * - Gracefully degrades to no-op for unauthenticated users
 */
@Injectable({ providedIn: 'root' })
export class ProgressSyncService {
  private get db() {
    return getFirestore();
  }

  private static readonly WRITE_INTERVAL_MS = 5000;
  private static readonly MIN_POSITION_SECONDS = 2;

  private writeTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingWrite: { episodeId: string; position: number; duration: number; uid: string } | null = null;
  private lastWriteTime = 0;

  /** Load saved position for an episode. Returns 0 if none saved. */
  async loadProgress(episodeId: string, uid: string | null): Promise<number> {
    if (!uid || !episodeId) return 0;
    try {
      const snap = await getDoc(doc(this.db, 'users', uid, 'progress', episodeId));
      if (!snap.exists()) return 0;
      const data = snap.data() as EpisodeProgress;
      // Don't restore if episode was completed (within last 30s of duration)
      if (data.completedAt) return 0;
      return data.position ?? 0;
    } catch (err) {
      console.error('[ProgressSyncService] Failed to load progress', err);
      return 0;
    }
  }

  /**
   * Schedule a throttled write. Writes at most every 5s during playback.
   * Call from AudioService timeupdate handler.
   */
  scheduleWrite(episodeId: string, position: number, duration: number, uid: string | null): void {
    if (!uid || !episodeId || position < ProgressSyncService.MIN_POSITION_SECONDS) return;

    this.pendingWrite = { episodeId, position, duration, uid };

    const elapsed = Date.now() - this.lastWriteTime;
    if (elapsed >= ProgressSyncService.WRITE_INTERVAL_MS) {
      this.flush();
    } else if (!this.writeTimeout) {
      const remaining = ProgressSyncService.WRITE_INTERVAL_MS - elapsed;
      this.writeTimeout = setTimeout(() => this.flush(), remaining);
    }
  }

  /** Force an immediate write of any pending progress (call on pause, episode change). */
  async flush(): Promise<void> {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    if (!this.pendingWrite) return;

    const { episodeId, position, duration, uid } = this.pendingWrite;
    this.pendingWrite = null;
    this.lastWriteTime = Date.now();

    try {
      // completedAt is intentionally omitted — only markCompleted() may set it.
      // Writing null here would clobber completion status set on another device.
      await setDoc(
        doc(this.db, 'users', uid, 'progress', episodeId),
        { episodeId, position, duration, updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.error('[ProgressSyncService] Failed to save progress', err);
    }
  }

  /** Mark episode as fully completed. */
  async markCompleted(episodeId: string, duration: number, uid: string | null): Promise<void> {
    if (!uid || !episodeId) return;
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    this.pendingWrite = null;
    this.lastWriteTime = Date.now();
    try {
      await setDoc(
        doc(this.db, 'users', uid, 'progress', episodeId),
        { episodeId, position: duration, duration, completedAt: Date.now(), updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.error('[ProgressSyncService] Failed to mark episode completed', err);
    }
  }
}
