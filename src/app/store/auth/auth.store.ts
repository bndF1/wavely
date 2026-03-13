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
  withMethods((store, authService = inject(AuthService)) => ({
    init: rxMethod<void>(
      tap(() => {
        authService.user$.subscribe((user) => {
          patchState(store, { user, loading: false });
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
      await authService.signOut();
      patchState(store, { user: null });
    },
  }))
);
