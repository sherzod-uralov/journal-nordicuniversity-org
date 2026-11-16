import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule } from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { securityHeaders } from './server/security';
import { createSsrCache } from './server/cache';
import { registerSitemap } from './server/sitemap';
import { registerImageOptimizer } from './server/image-optimizer';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const PORT = process.env['PORT'] || 3772;
const SITE_URL = process.env['SITE_URL']
  || (process.env['NODE_ENV'] === 'production'
    ? 'https://journal.nordicuniversity.org'
    : `https://journal.nordicuniversity.org`);
const API_URL = process.env['API_URL'] || 'https://journal2.nordicun.uz';

// AngularNodeAppEngine always builds the request URL from X-Forwarded-Host/-Proto/-Port when present
// (there is no option to ignore them), so the reverse proxy MUST overwrite these headers itself, e.g. in nginx:
//   proxy_set_header Host $host;
//   proxy_set_header X-Forwarded-Host $host;
//   proxy_set_header X-Forwarded-Proto $scheme;
// and the Node port must not be reachable directly from the internet.
const ALLOWED_HOSTS = (process.env['ALLOWED_HOSTS']
  || 'localhost,journal.nordicuniversity.org,www.journal.nordicuniversity.org')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const app = express();

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ALLOWED_HOSTS,
});

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(securityHeaders(API_URL));

// Angular build output with a content hash in the name: main-XXXXXXXX.js, chunk-XXXXXXXX.js, styles-XXXXXXXX.css, media/*-XXXXXXXX.*
const HASHED_ASSET = /^(?:[\w.-]+-[A-Z0-9]{8}\.(?:js|mjs|css)|media\/[\w.-]+-[A-Z0-9]{8}\.\w+)$/;

app.use(express.static(browserDistFolder, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    const file = relative(browserDistFolder, filePath).split(sep).join('/');
    if (HASHED_ASSET.test(file)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (file.startsWith('i18n/')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  },
}));

registerSitemap(app, SITE_URL, API_URL);
registerImageOptimizer(app, API_URL);

// Missing static files (e.g. a chunk from a previous deploy) must 404 instead of falling through to SSR HTML.
const STATIC_FILE_EXT = /\.(?:js|mjs|cjs|css|map|json|txt|xml|xsl|ico|png|jpe?g|gif|webp|avif|svg|woff2?|ttf|eot|otf|webmanifest|wasm)$/i;
app.get('{*path}', (req, res, next) => {
  if (!STATIC_FILE_EXT.test(req.path)) {
    next();
    return;
  }
  res.status(404).type('text/plain').setHeader('Cache-Control', 'no-store');
  res.send('Not found');
});

// SSR renders are anonymous (no auth token on the server); the cache key includes the lang and logged_in cookies.
const ssrCache = createSsrCache(angularApp, {
  ttl: 30_000,
  allowedHosts: ALLOWED_HOSTS,
});
app.get('{*path}', ssrCache.handler);

const shouldListen =
  isMainModule(import.meta.url) || process.env['SSR_FORCE_LISTEN'] === '1';

if (shouldListen) {
  app.listen(PORT, () => {
    console.log(`SSR server listening on http://localhost:${PORT}`);
    console.log(`Cache: TTL=${ssrCache.ttl / 1000}s, max=${ssrCache.maxSize} entries`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
