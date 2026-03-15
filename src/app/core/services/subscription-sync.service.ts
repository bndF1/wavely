import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from '@angular/fire/firestore';
import { Podcast } from '../models/podcast.model';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';

/**
 * SubscriptionSyncService
 *
 * Single source of truth for subscription mutations.
 * All subscribe/unsubscribe actions should go through this service —
 * it updates PodcastsStore (in-memory) AND persists to Firestore
 * when a user is authenticated.
 *
 * Firestore path: users/{uid}/subscriptions/{podcastId}
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionSyncService {
  private readonly store = inject(PodcastsStore);
  private readonly firestore = inject(Firestore);

  /**
   * Load all subscriptions for a user from Firestore and replace the store.
   * `isStillCurrentUser` guards against stale results when the user changes
   * before the async getDocs call resolves.
   */
  async loadFromFirestore(uid: string, isStillCurrentUser: () => boolean): Promise<void> {
    try {
      const colRef = collection(this.firestore, 'users', uid, 'subscriptions');
      const snapshot = await getDocs(colRef);
      // Drop result if user signed out or switched while the request was in-flight
      if (!isStillCurrentUser()) return;
      const podcasts = snapshot.docs.map((d) => d.data() as Podcast);
      // Merge remote subscriptions with any locally-added ones that may have been
      // added after this read started (prevents race condition overwriting optimistic updates).
      const remoteIds = new Set(podcasts.map((p) => p.id));
      const localOnly = this.store.subscriptions().filter((p) => !remoteIds.has(p.id));
      this.store.setSubscriptions([...podcasts, ...localOnly]);
    } catch (err) {
      console.error('[SubscriptionSyncService] Failed to load subscriptions', err);
    }
  }

  /** Subscribe to a podcast — updates store and persists to Firestore if authed. */
  async addSubscription(podcast: Podcast, uid: string | null): Promise<void> {
    this.store.addSubscription(podcast);
    if (!uid) return;
    try {
      const docRef = doc(this.firestore, 'users', uid, 'subscriptions', podcast.id);
      // Strip undefined values — Firestore rejects them as "Unsupported field value"
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(podcast)) {
        if (value !== undefined) data[key] = value;
      }
      await setDoc(docRef, data);
    } catch (err) {
      console.error('[SubscriptionSyncService] Failed to persist subscription', err);
      // Rollback optimistic update
      this.store.removeSubscription(podcast.id);
    }
  }

  /** Unsubscribe from a podcast — updates store and removes from Firestore if authed. */
  async removeSubscription(podcastId: string, uid: string | null): Promise<void> {
    const snapshot = this.store.subscriptions().find((p) => p.id === podcastId) ?? null;
    this.store.removeSubscription(podcastId);
    if (!uid) return;
    try {
      const docRef = doc(this.firestore, 'users', uid, 'subscriptions', podcastId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[SubscriptionSyncService] Failed to remove subscription', err);
      // Rollback optimistic update if we have the original data
      if (snapshot) this.store.addSubscription(snapshot);
    }
  }

  /** Clear all in-memory subscriptions (called on sign-out). */
  clearSubscriptions(): void {
    this.store.setSubscriptions([]);
  }
}
