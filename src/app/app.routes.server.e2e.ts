import { RenderMode, ServerRoute } from '@angular/ssr';

// E2E build server routes — extends the base routes with the e2e-auth
// route which only exists when environment.useEmulators = true.
export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'e2e-auth/:token',
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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
