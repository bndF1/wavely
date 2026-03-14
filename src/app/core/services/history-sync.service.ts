import { inject, Injectable } from '@angular/core';
import { Firestore, collection, deleteDoc, doc, getDocs, setDoc } from '@angular/fire/firestore';
import { HistoryEntry, HistoryStore } from '../../store/history/history.store';

@Injectable({ providedIn: 'root' })
export class HistorySyncService {
  private readonly firestore = inject(Firestore);
  private readonly historyStore = inject(HistoryStore);

  async recordPlay(entry: HistoryEntry, uid: string): Promise<void> {
    if (!uid || !entry.episodeId) return;

    try {
      const docRef = doc(this.firestore, 'users', uid, 'history', entry.episodeId);
      await setDoc(docRef, { ...entry, lastPlayedAt: entry.lastPlayedAt ?? Date.now() }, { merge: true });
      this.historyStore.addOrUpdate(entry);
    } catch (err) {
      console.error('[HistorySyncService] Failed to record play', err);
    }
  }

  async loadHistory(uid: string): Promise<HistoryEntry[]> {
    if (!uid) return [];

    try {
      const colRef = collection(this.firestore, 'users', uid, 'history');
      const snapshot = await getDocs(colRef);
      return snapshot.docs
        .map((docSnapshot) => docSnapshot.data() as Partial<HistoryEntry>)
        .map((entry) => ({
          episodeId: entry.episodeId ?? '',
          episodeTitle: entry.episodeTitle ?? 'Untitled episode',
          podcastTitle: entry.podcastTitle ?? 'Unknown podcast',
          imageUrl: entry.imageUrl ?? '/default-artwork.svg',
          position: entry.position ?? 0,
          duration: entry.duration ?? 0,
          lastPlayedAt: entry.lastPlayedAt ?? 0,
          completed: entry.completed ?? false,
        }))
        .filter((entry) => !!entry.episodeId)
        .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    } catch (err) {
      console.error('[HistorySyncService] Failed to load history', err);
      return [];
    }
  }

  async clearHistory(uid: string): Promise<void> {
    if (!uid) {
      this.historyStore.clear();
      return;
    }

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
