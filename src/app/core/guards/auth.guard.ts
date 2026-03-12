import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../../store/auth/auth.store';

/**
 * Route guard that redirects unauthenticated users to the login page.
 *
 * Usage in routes:
 *   { path: 'library', canActivate: [authGuard], loadComponent: () => ... }
 */
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
