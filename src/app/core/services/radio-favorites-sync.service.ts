import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from '@angular/fire/firestore';

import { RadioStation } from '../models/radio-station.model';
import { UserPreferencesService } from './user-preferences.service';

/**
 * RadioFavoritesSyncService
 *
 * Single source of truth for radio favorite mutations.
 * All add/remove actions go through this service — it updates
 * UserPreferencesService (in-memory + localStorage) AND persists
 * to Firestore when a user is authenticated.
 *
 * Firestore path: users/{uid}/favoriteStations/{stationuuid}
 */
@Injectable({ providedIn: 'root' })
export class RadioFavoritesSyncService {
  private readonly prefs = inject(UserPreferencesService);
  private readonly firestore = inject(Firestore);

  /**
   * Load all favorite stations for a user from Firestore and merge with localStorage.
   * `isStillCurrentUser` guards against stale results when the user changes mid-flight.
   */
  async loadFromFirestore(uid: string, isStillCurrentUser: () => boolean): Promise<void> {
    try {
      const colRef = collection(this.firestore, 'users', uid, 'favoriteStations');
      const snapshot = await getDocs(colRef);
      if (!isStillCurrentUser()) return;

      const remote = snapshot.docs.map((d) => d.data() as RadioStation);
      const remoteIds = new Set(remote.map((s) => s.stationuuid));
      // Merge: keep any locally-added favorites not yet in Firestore
      const localOnly = this.prefs.favoriteStations().filter((s) => !remoteIds.has(s.stationuuid));
      this.prefs.setFavoriteStations([...remote, ...localOnly]);
    } catch (err) {
      console.error('[RadioFavoritesSyncService] Failed to load favorites', err);
    }
  }

  /** Toggle favorite — optimistic update to signal/localStorage + Firestore sync if authed. */
  async syncToggle(station: RadioStation, uid: string | null): Promise<void> {
    const isFav = this.prefs.isFavorite(station.stationuuid);
    if (isFav) {
      await this.removeFavorite(station.stationuuid, uid);
    } else {
      await this.addFavorite(station, uid);
    }
  }

  /** Add a favorite — optimistic, then persists to Firestore if authed. */
  async addFavorite(station: RadioStation, uid: string | null): Promise<void> {
    this.prefs.addFavoriteStation(station);
    if (!uid) return;
    try {
      const docRef = doc(this.firestore, 'users', uid, 'favoriteStations', station.stationuuid);
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(station)) {
        if (value !== undefined) data[key] = value;
      }
      await setDoc(docRef, data);
    } catch (err) {
      console.error('[RadioFavoritesSyncService] Failed to add favorite', err);
      // Rollback optimistic update
      this.prefs.removeFavoriteStation(station.stationuuid);
    }
  }

  /** Remove a favorite — optimistic, then deletes from Firestore if authed. */
  async removeFavorite(stationuuid: string, uid: string | null): Promise<void> {
    const snapshot = this.prefs.favoriteStations().find((s) => s.stationuuid === stationuuid) ?? null;
    this.prefs.removeFavoriteStation(stationuuid);
    if (!uid) return;
    try {
      const docRef = doc(this.firestore, 'users', uid, 'favoriteStations', stationuuid);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[RadioFavoritesSyncService] Failed to remove favorite', err);
      // Rollback optimistic update
      if (snapshot) this.prefs.addFavoriteStation(snapshot);
    }
  }

  /** Clear in-memory favorites (called on sign-out). */
  clearFavorites(): void {
    this.prefs.setFavoriteStations([]);
  }
}
