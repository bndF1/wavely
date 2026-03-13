import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
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
  private get db() {
    return getFirestore();
  }

  /** Load all subscriptions for a user from Firestore and hydrate the store. */
  async loadFromFirestore(uid: string): Promise<void> {
    try {
      const colRef = collection(this.db, 'users', uid, 'subscriptions');
      const snapshot = await getDocs(colRef);
      const podcasts = snapshot.docs.map((d) => d.data() as Podcast);
      // Replace in-memory subscriptions with the Firestore data
      for (const podcast of podcasts) {
        this.store.addSubscription(podcast);
      }
    } catch (err) {
      console.error('[SubscriptionSyncService] Failed to load subscriptions', err);
    }
  }

  /** Subscribe to a podcast — updates store and persists to Firestore if authed. */
  async addSubscription(podcast: Podcast, uid: string | null): Promise<void> {
    this.store.addSubscription(podcast);
    if (!uid) return;
    try {
      const docRef = doc(this.db, 'users', uid, 'subscriptions', podcast.id);
      await setDoc(docRef, { ...podcast });
    } catch (err) {
      console.error('[SubscriptionSyncService] Failed to persist subscription', err);
    }
  }

  /** Unsubscribe from a podcast — updates store and removes from Firestore if authed. */
  async removeSubscription(podcastId: string, uid: string | null): Promise<void> {
    this.store.removeSubscription(podcastId);
    if (!uid) return;
    try {
      const docRef = doc(this.db, 'users', uid, 'subscriptions', podcastId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[SubscriptionSyncService] Failed to remove subscription', err);
    }
  }

  /** Clear all in-memory subscriptions (called on sign-out). */
  clearSubscriptions(): void {
    const ids = this.store.subscriptions().map((p) => p.id);
    for (const id of ids) {
      this.store.removeSubscription(id);
    }
  }
}
