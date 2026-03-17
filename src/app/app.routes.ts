import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { environment } from '../environments/environment';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.page').then((m) => m.LoginPage),
  },
  // E2E-only: signs in with a custom token from the Playwright global setup.
  // Tree-shaken from all non-emulator builds.
  ...(environment.useEmulators
    ? [
        {
          path: 'e2e-auth/:token',
          loadComponent: () =>
            import('./features/e2e-auth/e2e-auth.component').then(
              (m) => m.E2eAuthComponent
            ),
        },
      ]
    : []),
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tabs/tabs.component').then((m) => m.TabsComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'discover',
        loadComponent: () =>
          import('./features/discover/discover.page').then((m) => m.DiscoverPage),
      },
      {
        path: 'radio',
        loadComponent: () =>
          import('./features/radio/radio.page').then((m) => m.RadioPage),
      },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'browse',
        redirectTo: 'discover',
        pathMatch: 'full',
      },
      {
        path: 'search',
        redirectTo: 'discover',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'browse/category/:genreId',
    loadComponent: () =>
      import('./features/browse/category-detail/category-detail.page').then(
        (m) => m.CategoryDetailPage
      ),
  },
  {
    path: 'podcast/:id',
    loadComponent: () =>
      import('./features/podcast-detail/podcast-detail.page').then(
        (m) => m.PodcastDetailPage
      ),
  },
  {
    path: 'publisher/:artistId',
    loadComponent: () =>
      import('./features/publisher/publisher.page').then(
        (m) => m.PublisherPage
      ),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.page').then((m) => m.SettingsPage),
  },
];
