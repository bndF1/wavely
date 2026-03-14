import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { HistoryEntry, HistoryStore } from '../../store/history/history.store';

@Injectable({ providedIn: 'root' })
export class HistorySyncService {
  private readonly firestore = inject(Firestore);
  private readonly historyStore = inject(HistoryStore);

  async recordPlay(entry: HistoryEntry, uid: string): Promise<void> {
    if (!uid || !entry.episodeId) return;
    const normalized: HistoryEntry = { ...entry, lastPlayedAt: entry.lastPlayedAt || Date.now() };
    try {
      const docRef = doc(this.firestore, 'users', uid, 'history', normalized.episodeId);
      await setDoc(docRef, normalized, { merge: true });
      this.historyStore.addOrUpdate(normalized);
    } catch (err) {
      console.error('[HistorySyncService] Failed to record play', err);
    }
  }

  async updateEntry(episodeId: string, partial: Partial<HistoryEntry>, uid: string): Promise<void> {
    if (!uid || !episodeId) return;

    const docRef = doc(this.firestore, 'users', uid, 'history', episodeId);
    try {
      await updateDoc(docRef, partial);
    } catch (updateError) {
      try {
        await setDoc(docRef, partial, { merge: true });
      } catch (setError) {
        console.error('[HistorySyncService] Failed to update entry', { episodeId, partial, updateError, setError });
        return;
      }
    }

    const existingEntry = this.historyStore.entries().find((entry) => entry.episodeId === episodeId);
    if (!existingEntry) return;
    this.historyStore.addOrUpdate({ ...existingEntry, ...partial, episodeId });
  }

  async loadHistory(uid: string): Promise<HistoryEntry[]> {
    if (!uid) return [];
    try {
      const colRef = collection(this.firestore, 'users', uid, 'history');
      const snapshot = await getDocs(colRef);
      return snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as Partial<HistoryEntry>;
          const episodeId = data.episodeId || docSnapshot.id;
          return {
            episodeId,
            episodeTitle: data.episodeTitle ?? 'Untitled episode',
            podcastTitle: data.podcastTitle ?? 'Unknown podcast',
            imageUrl: data.imageUrl ?? '/default-artwork.svg',
            position: data.position ?? 0,
            duration: data.duration ?? 0,
            lastPlayedAt: data.lastPlayedAt ?? 0,
            completed: data.completed ?? false,
          };
        })
        .filter((entry) => !!entry.episodeId)
        .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    } catch (err) {
      console.error('[HistorySyncService] Failed to load history', err);
      return [];
    }
  }

  async clearHistory(uid: string): Promise<void> {
    if (!uid) { this.historyStore.clear(); return; }
    try {
      const colRef = collection(this.firestore, 'users', uid, 'history');
      const snapshot = await getDocs(colRef);
      await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
      this.historyStore.clear();
    } catch (err) {
      console.error('[HistorySyncService] Failed to clear history', err);
      this.historyStore.clear();
    }
  }
}
