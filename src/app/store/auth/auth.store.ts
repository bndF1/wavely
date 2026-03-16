import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tap } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { HistorySyncService } from '../../core/services/history-sync.service';
import { HistoryStore } from '../history/history.store';
import { PlayerStore } from '../player/player.store';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => user() !== null),
    displayName: computed(() => user()?.displayName ?? null),
    photoURL: computed(() => user()?.photoURL ?? null),
    email: computed(() => user()?.email ?? null),
  })),
  withMethods((
    store,
    authService = inject(AuthService),
    syncService = inject(SubscriptionSyncService),
    historySyncService = inject(HistorySyncService),
    historyStore = inject(HistoryStore),
    playerStore = inject(PlayerStore)
  ) => ({
    init: rxMethod<void>(
      tap(() => {
        authService.user$.subscribe((user) => {
          const previousUid = store.user()?.uid ?? null;
          const isUserSwitch = !!user && user.uid !== previousUid;
          const isSignOut = !user && !!previousUid;

          // Stop the player and clear queue BEFORE updating store.user to prevent
          // progress writes being attributed to the new user's UID during the transition.
          if (isUserSwitch || isSignOut) {
            playerStore.close();
            playerStore.clearQueue();
          }

          patchState(store, { user, loading: false });

          if (isUserSwitch) {
            syncService.clearSubscriptions();
            historyStore.clear();
            historyStore.setLoading(true);

            // Pass a stale-result guard: discard getDocs result if user changed mid-flight
            syncService.loadFromFirestore(user.uid, () => store.user()?.uid === user.uid);
            historySyncService
              .loadHistory(user.uid)
              .then((entries) => {
                if (store.user()?.uid !== user.uid) return;

                const mergedByEpisodeId = new Map(
                  historyStore.entries().map((entry) => [entry.episodeId, entry])
                );

                for (const entry of entries) {
                  const existing = mergedByEpisodeId.get(entry.episodeId);
                  if (!existing || entry.lastPlayedAt >= existing.lastPlayedAt) {
                    mergedByEpisodeId.set(entry.episodeId, entry);
                  }
                }

                historyStore.setEntries(Array.from(mergedByEpisodeId.values()));
              })
              .catch((err) => {
                console.error('[AuthStore] Failed to load history', err);
                historyStore.setLoading(false);
              });
          } else if (isSignOut) {
            // Player already closed above — clear all in-memory state
            syncService.clearSubscriptions();
            historyStore.clear();
          }
        });
      })
    ),
    async signInWithGoogle(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await authService.signInWithGoogle();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sign-in failed';
        patchState(store, { error: message, loading: false });
      }
    },
    async signOut(): Promise<void> {
      // Don't manually patch user to null here — the user$ subscriber handles it
      // and clearing subscriptions. A manual patchState here would zero out
      // store.user() *before* user$ fires, causing previousUid to be null and
      // skipping the clearSubscriptions() call.
      await authService.signOut();
    },
  }))
);
