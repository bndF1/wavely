import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'tabs/**',
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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
