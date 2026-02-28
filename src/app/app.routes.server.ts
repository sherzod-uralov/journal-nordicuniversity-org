import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'auth/**', renderMode: RenderMode.Client },
  { path: 'cabinet/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
