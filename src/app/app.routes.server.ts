import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tabs/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'browse/category/:genreId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'podcast/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'episode/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'publisher/:artistId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'settings',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
