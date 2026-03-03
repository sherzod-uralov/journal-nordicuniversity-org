import type { Request, Response, NextFunction } from 'express';
import type { AngularNodeAppEngine } from '@angular/ssr/node';

interface CacheEntry {
  html: string;
  headers: [string, string][];
  status: number;
  createdAt: number;
}

export function createSsrCache(angularApp: AngularNodeAppEngine, ttl = 60_000, maxSize = 200) {
  const cache = new Map<string, CacheEntry>();

  function getKey(req: Request): string {
    return req.originalUrl || req.url;
  }

  function evictOldest(): void {
    if (cache.size <= maxSize) return;
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  function isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > ttl;
  }

  function serveCached(res: Response, entry: CacheEntry): void {
    res.status(entry.status);
    for (const [key, value] of entry.headers) {
      res.setHeader(key, value);
    }
    res.setHeader('X-SSR-Cache', 'HIT');
    res.send(entry.html);
  }

  async function renderAndCache(req: Request, key: string): Promise<CacheEntry | null> {
    const response = await angularApp.handle(req);
    if (!response) return null;

    const html = await response.text();
    const headers: [string, string][] = [];
    response.headers.forEach((value, name) => {
      if (name !== 'transfer-encoding') {
        headers.push([name, value]);
      }
    });

    const entry: CacheEntry = { html, headers, status: response.status, createdAt: Date.now() };
    evictOldest();
    cache.set(key, entry);
    return entry;
  }

  function handler(req: Request, res: Response, next: NextFunction): void {
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
          for (const [k, v] of entry.headers) {
            res.setHeader(k, v);
          }
          res.send(entry.html);
        } else {
          next();
        }
      })
      .catch(next);
  }

  return { handler, ttl, maxSize };
}
