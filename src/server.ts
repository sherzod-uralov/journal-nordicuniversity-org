import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule } from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { securityHeaders } from './server/security';
import { createSsrCache } from './server/cache';
import { registerSitemap } from './server/sitemap';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const PORT = process.env['PORT'] || 4200;
const SITE_URL = process.env['SITE_URL']
  || (process.env['NODE_ENV'] === 'production'
    ? 'https://journal.nordicuniversity.org'
    : `http://localhost:${PORT}`);
const API_URL = process.env['API_URL'] || 'https://journal2.nordicun.uz';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(securityHeaders());

app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  immutable: true,
  index: false,
  etag: true,
  lastModified: true,
}));

registerSitemap(app, SITE_URL, API_URL);

const ssrCache = createSsrCache(angularApp);
app.get('{*path}', ssrCache.handler);

if (isMainModule(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`SSR server listening on http://localhost:${PORT}`);
    console.log(`Cache: TTL=${ssrCache.ttl / 1000}s, max=${ssrCache.maxSize} entries`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
