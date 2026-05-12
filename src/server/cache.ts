import type { Request, Response, NextFunction } from 'express';
import type { AngularNodeAppEngine } from '@angular/ssr/node';

interface CacheEntry {
  html: string;
  headers: [string, string][];
  status: number;
  createdAt: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  skipPaths?: (string | RegExp)[];
}

export function createSsrCache(angularApp: AngularNodeAppEngine, options: CacheOptions = {}) {
  const ttl = options.ttl ?? 60_000;
  const maxSize = options.maxSize ?? 200;
  const skipPaths = options.skipPaths ?? [];
  const cache = new Map<string, CacheEntry>();

  function getPath(req: Request): string {
    const url = req.originalUrl || req.url;
    const qIndex = url.indexOf('?');
    return qIndex === -1 ? url : url.slice(0, qIndex);
  }

  function shouldSkipCache(req: Request): boolean {
    const path = getPath(req);
    return skipPaths.some((p) => {
      if (typeof p === 'string') {
        if (p === '/') return path === '/';
        return path === p || path.startsWith(p + '/');
      }
      return p.test(path);
    });
  }

  function getKey(req: Request): string {
    const url = req.originalUrl || req.url;
    const cookies = req.headers.cookie || '';
    const langMatch = cookies.match(/(?:^|;\s*)lang=(uz|ru|en)/);
    const lang = langMatch ? langMatch[1] : 'en';
    const loggedIn = /(?:^|;\s*)logged_in=1/.test(cookies) ? '1' : '0';
    return `${url}|${lang}|${loggedIn}`;
  }

  function evictOldest(): void {
    if (cache.size <= maxSize) return;
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  function isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > ttl;
  }

  function applyHeaders(res: Response, headers: [string, string][]): void {
    for (const [key, value] of headers) {
      res.setHeader(key, value);
    }
  }

  function serveCached(res: Response, entry: CacheEntry): void {
    res.status(entry.status);
    applyHeaders(res, entry.headers);
    res.setHeader('X-SSR-Cache', 'HIT');
    res.send(entry.html);
  }

  async function render(req: Request): Promise<{ html: string; headers: [string, string][]; status: number } | null> {
    const response = await angularApp.handle(req);
    if (!response) return null;

    const html = await response.text();
    const headers: [string, string][] = [];
    response.headers.forEach((value, name) => {
      if (name !== 'transfer-encoding') {
        headers.push([name, value]);
      }
    });
    return { html, headers, status: response.status };
  }

  async function renderAndCache(req: Request, key: string): Promise<CacheEntry | null> {
    const result = await render(req);
    if (!result) return null;

    const entry: CacheEntry = { ...result, createdAt: Date.now() };
    evictOldest();
    cache.set(key, entry);
    return entry;
  }

  function handler(req: Request, res: Response, next: NextFunction): void {
    if (shouldSkipCache(req)) {
      render(req)
        .then((result) => {
          if (!result) {
            next();
            return;
          }
          res.status(result.status);
          applyHeaders(res, result.headers);
          res.setHeader('X-SSR-Cache', 'BYPASS');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.send(result.html);
        })
        .catch(next);
      return;
    }

    const key = getKey(req);
    const cached = cache.get(key);

    if (cached) {
      serveCached(res, cached);
      if (isStale(cached)) {
        renderAndCache(req, key).catch(() => cache.delete(key));
      }
      return;
    }

    res.setHeader('X-SSR-Cache', 'MISS');
    renderAndCache(req, key)
      .then((entry) => {
        if (entry) {
          res.status(entry.status);
          applyHeaders(res, entry.headers);
          res.send(entry.html);
        } else {
          next();
        }
      })
      .catch(next);
  }

  function invalidate(predicate?: (key: string) => boolean): number {
    if (!predicate) {
      const size = cache.size;
      cache.clear();
      return size;
    }
    let count = 0;
    for (const key of cache.keys()) {
      if (predicate(key)) {
        cache.delete(key);
        count++;
      }
    }
    return count;
  }

  return { handler, invalidate, ttl, maxSize, skipPaths };
}
