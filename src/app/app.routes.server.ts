import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'auth/**', renderMode: RenderMode.Client },
  { path: 'cabinet/**', renderMode: RenderMode.Client },
  { path: 'guidelines', renderMode: RenderMode.Client },
  { path: 'bookmarks', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
