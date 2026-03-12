import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { User } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';

export interface AuthState {
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
  withComputed((store) => ({
    isAuthenticated: computed(() => store.user() !== null),
  })),
  withMethods((store, authService = inject(AuthService)) => ({
    async signInWithGoogle(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await authService.signInWithGoogle();
        // user state is updated via the onInit subscription
      } catch (err) {
        patchState(store, {
          loading: false,
          error: err instanceof Error ? err.message : 'Sign-in failed',
        });
      }
    },
    async signOut(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await authService.signOut();
        // user state is updated via the onInit subscription
      } catch (err) {
        patchState(store, {
          loading: false,
          error: err instanceof Error ? err.message : 'Sign-out failed',
        });
      }
    },
    /** Exposed for internal use — called from the onInit subscription. */
    _setUser(user: User | null): void {
      patchState(store, { user, loading: false, error: null });
    },
  })),
  withHooks({
    onInit(
      store,
      authService = inject(AuthService),
      syncService = inject(SubscriptionSyncService),
    ) {
      authService.user$.pipe(takeUntilDestroyed()).subscribe((user) => {
        store._setUser(user);
        syncService.setUser(user);
        if (user) {
          syncService.loadFromFirestore(user);
        } else {
          syncService.clearSubscriptions();
        }
      });
    },
  }),
);
