import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./features/tabs/tabs.component').then((m) => m.TabsComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'browse',
        loadComponent: () =>
          import('./features/browse/browse.page').then((m) => m.BrowsePage),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search.page').then((m) => m.SearchPage),
      },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'podcast/:id',
    loadComponent: () =>
      import('./features/podcast-detail/podcast-detail.page').then(
        (m) => m.PodcastDetailPage
      ),
  },
  {
    path: 'episode/:id',
    loadComponent: () =>
      import('./features/episode-detail/episode-detail.page').then(
        (m) => m.EpisodeDetailPage
      ),
  },
];
