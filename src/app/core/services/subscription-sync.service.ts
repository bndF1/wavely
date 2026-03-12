import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  Firestore,
} from '@angular/fire/firestore';
import type { User } from '@angular/fire/auth';
import { Podcast } from '../models/podcast.model';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';

interface SubscriptionDoc {
  podcast: Podcast;
  subscribedAt: Timestamp;
}

/**
 * SubscriptionSyncService
 *
 * Adds Firestore-backed persistence on top of the in-memory PodcastsStore.
 *
 * - When a user signs in, call `loadFromFirestore(user)` to restore their
 *   saved subscriptions.
 * - Use `add(podcast)` and `remove(podcastId)` instead of the store methods
 *   to keep Firestore in sync.
 *
 * Firestore path: users/{uid}/subscriptions/{podcastId}
 *
 * When the user is unauthenticated all operations fall back to local-only
 * store mutations so the app remains functional without sign-in.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionSyncService {
  private readonly firestore = inject(Firestore);
  private readonly podcastsStore = inject(PodcastsStore);
  private readonly platformId = inject(PLATFORM_ID);

  private currentUser: User | null = null;

  setUser(user: User | null): void {
    this.currentUser = user;
  }

  /** Load subscriptions from Firestore and hydrate the in-memory store. */
  async loadFromFirestore(user: User): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const col = collection(this.firestore, 'users', user.uid, 'subscriptions');
      const snapshot = await getDocs(col);
      const podcasts = snapshot.docs.map((d) => (d.data() as SubscriptionDoc).podcast);
      this.podcastsStore.setSubscriptions(podcasts);
    } catch {
      // Firestore may be unavailable with placeholder credentials — fail silently
    }
  }

  /** Clear in-memory subscriptions on sign-out. */
  clearSubscriptions(): void {
    this.podcastsStore.setSubscriptions([]);
  }

  /** Subscribe to a podcast, persisting to Firestore when authenticated. */
  add(podcast: Podcast): void {
    this.podcastsStore.addSubscription(podcast);
    if (this.currentUser && isPlatformBrowser(this.platformId)) {
      const ref = doc(
        this.firestore,
        'users',
        this.currentUser.uid,
        'subscriptions',
        podcast.id,
      );
      setDoc(ref, { podcast, subscribedAt: Timestamp.now() }).catch((err) => {
        console.error('[SubscriptionSyncService] Failed to persist subscription:', err);
      });
    }
  }

  /** Unsubscribe from a podcast, removing the Firestore document when authenticated. */
  remove(podcastId: string): void {
    this.podcastsStore.removeSubscription(podcastId);
    if (this.currentUser && isPlatformBrowser(this.platformId)) {
      const ref = doc(
        this.firestore,
        'users',
        this.currentUser.uid,
        'subscriptions',
        podcastId,
      );
      deleteDoc(ref).catch((err) => {
        console.error('[SubscriptionSyncService] Failed to remove subscription:', err);
      });
    }
  }
}
