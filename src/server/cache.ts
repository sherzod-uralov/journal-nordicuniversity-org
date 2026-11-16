import type { Request, Response, NextFunction } from 'express';
import type { AngularNodeAppEngine } from '@angular/ssr/node';

interface RenderResult {
  html: string;
  headers: [string, string][];
  status: number;
}

interface CacheEntry extends RenderResult {
  createdAt: number;
  size: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  /** Upper bound for the memory held by cached HTML (approximate, in bytes). */
  maxBytes?: number;
  skipPaths?: (string | RegExp)[];
  /** Same list passed to AngularNodeAppEngine; requests for other hosts never touch the cache. */
  allowedHosts?: string[];
}

// Browsers may keep the page (bfcache) but must revalidate before reuse; never stored by shared caches.
const HTML_CACHE_CONTROL = 'private, no-cache';

export function createSsrCache(angularApp: AngularNodeAppEngine, options: CacheOptions = {}) {
  const ttl = options.ttl ?? 60_000;
  const maxSize = options.maxSize ?? 200;
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  const skipPaths = options.skipPaths ?? [];
  const allowedHosts = options.allowedHosts ? new Set(options.allowedHosts) : null;
  // Map iteration order = insertion order; entries are re-inserted on use, so the first key is the LRU one.
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<RenderResult | null>>();
  let totalBytes = 0;

  function getPath(req: Request): string {
    const url = req.originalUrl || req.url;
    const qIndex = url.indexOf('?');
    const path = qIndex === -1 ? url : url.slice(0, qIndex);
    // '/articles/' must match like '/articles'; keep the root as '/'
    return path.length > 1 ? path.replace(/\/+$/, '') || '/' : path;
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

  function hostnameOf(value: string | string[] | undefined): string | null {
    const first = (Array.isArray(value) ? value[0] : value)?.split(',', 1)[0]?.trim();
    if (!first) return null;
    try {
      return new URL(`http://${first}`).hostname;
    } catch {
      return '';
    }
  }

  function isHostAllowed(hostname: string): boolean {
    if (!allowedHosts || allowedHosts.has(hostname)) return true;
    for (const allowed of allowedHosts) {
      if (allowed.startsWith('*.') && hostname.endsWith(allowed.slice(1))) return true;
    }
    return false;
  }

  /** Mirrors Angular's host validation so rejected requests (400) can't read or refresh cache entries. */
  function isTrustedHost(req: Request): boolean {
    for (const name of ['host', 'x-forwarded-host']) {
      const hostname = hostnameOf(req.headers[name]);
      if (hostname !== null && !isHostAllowed(hostname)) return false;
    }
    return true;
  }

  function getKey(req: Request): string {
    const url = req.originalUrl || req.url;
    const cookies = req.headers.cookie || '';
    const langMatch = cookies.match(/(?:^|;\s*)lang=(uz|ru|en)/);
    const lang = langMatch ? langMatch[1] : 'en';
    const loggedIn = /(?:^|;\s*)logged_in=1/.test(cookies) ? '1' : '0';
    return `${url}|${lang}|${loggedIn}`;
  }

  function isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > ttl;
  }

  function isCacheable(result: RenderResult): boolean {
    let isHtml = false;
    for (const [name, value] of result.headers) {
      if (name === 'set-cookie') return false;
      if (name === 'content-type' && value.includes('text/html')) isHtml = true;
    }
    return result.status === 200 && isHtml;
  }

  function remove(key: string): void {
    const entry = cache.get(key);
    if (!entry) return;
    cache.delete(key);
    totalBytes -= entry.size;
  }

  function store(key: string, result: RenderResult): void {
    // V8 may store non-Latin1 HTML as two-byte strings, so count 2 bytes per char.
    const size = result.html.length * 2;
    if (size > maxBytes) return;
    remove(key);
    while (cache.size > 0 && (cache.size >= maxSize || totalBytes + size > maxBytes)) {
      remove(cache.keys().next().value!);
    }
    cache.set(key, { ...result, createdAt: Date.now(), size });
    totalBytes += size;
  }

  function touch(key: string, entry: CacheEntry): void {
    cache.delete(key);
    cache.set(key, entry);
  }

  function send(res: Response, result: RenderResult, cacheStatus: 'HIT' | 'MISS' | 'BYPASS'): void {
    res.status(result.status);
    for (const [key, value] of result.headers) {
      res.setHeader(key, value);
    }
    if (result.headers.some(([name, value]) => name === 'content-type' && value.includes('text/html'))) {
      res.setHeader('Cache-Control', HTML_CACHE_CONTROL);
    }
    res.setHeader('X-SSR-Cache', cacheStatus);
    res.send(result.html);
  }

  async function render(req: Request): Promise<RenderResult | null> {
    const response = await angularApp.handle(req);
    if (!response) return null;

    const html = await response.text();
    const headers: [string, string][] = [];
    response.headers.forEach((value, name) => {
      if (name !== 'transfer-encoding' && name !== 'content-length') {
        headers.push([name, value]);
      }
    });
    return { html, headers, status: response.status };
  }

  /** Renders once per key at a time; only 200 text/html results replace the cached entry. */
  function renderAndCache(req: Request, key: string): Promise<RenderResult | null> {
    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = render(req)
      .then((result) => {
        if (result && isCacheable(result)) store(key, result);
        return result;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  function handler(req: Request, res: Response, next: NextFunction): void {
    if (!isTrustedHost(req) || shouldSkipCache(req)) {
      render(req)
        .then((result) => (result ? send(res, result, 'BYPASS') : next()))
        .catch(next);
      return;
    }

    const key = getKey(req);
    const cached = cache.get(key);

    if (cached) {
      touch(key, cached);
      send(res, cached, 'HIT');
      if (isStale(cached)) {
        // stale-while-revalidate: on failure / non-200 the old entry stays and is retried next hit
        renderAndCache(req, key).catch((err) => console.error('SSR cache refresh failed:', err));
      }
      return;
    }

    renderAndCache(req, key)
      .then((result) => (result ? send(res, result, 'MISS') : next()))
      .catch(next);
  }

  function invalidate(predicate?: (key: string) => boolean): number {
    if (!predicate) {
      const size = cache.size;
      cache.clear();
      totalBytes = 0;
      return size;
    }
    let count = 0;
    for (const key of [...cache.keys()]) {
      if (predicate(key)) {
        remove(key);
        count++;
      }
    }
    return count;
  }

  return { handler, invalidate, ttl, maxSize, maxBytes, skipPaths };
}
