import type { Express, Request, Response } from 'express';
import sharp from 'sharp';

interface ImageCache {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const cache = new Map<string, ImageCache>();
const MAX_CACHE = 500;
const MAX_CACHE_BYTES = 100 * 1024 * 1024; // 100 MB of optimized images
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cacheBytes = 0;

const FETCH_TIMEOUT = 10_000;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_INPUT_PIXELS = 40_000_000;

const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];
const ALLOWED_QUALITIES = [10, 20, 40, 60, 75, 85, 100];

/** Thrown for upstream failures; `status` is what the client gets (never the raw upstream status). */
class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`Upstream error ${status}`);
  }
}

const inFlight = new Map<string, Promise<Buffer>>();

function clampWidth(w: number): number {
  return ALLOWED_WIDTHS.find(a => a >= w) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

function clampQuality(q: number): number {
  return ALLOWED_QUALITIES.find(a => a >= q) ?? 75;
}

/** Resolves `url` against the API and returns it only if it stays on the API origin over http(s). */
function resolveApiUrl(url: string, apiUrl: string): string | null {
  try {
    const api = new URL(apiUrl);
    const target = /^https?:\/\//i.test(url) ? new URL(url) : new URL(url.replace(/^\/+/, ''), api.href.replace(/\/?$/, '/'));
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return null;
    if (target.origin !== api.origin || target.username || target.password) return null;
    return target.href;
  } catch {
    return null;
  }
}

function cacheSet(key: string, buffer: Buffer): void {
  const existing = cache.get(key);
  if (existing) {
    cache.delete(key);
    cacheBytes -= existing.buffer.length;
  }
  while (cache.size > 0 && (cache.size >= MAX_CACHE || cacheBytes + buffer.length > MAX_CACHE_BYTES)) {
    const oldestKey = cache.keys().next().value!;
    cacheBytes -= cache.get(oldestKey)!.buffer.length;
    cache.delete(oldestKey);
  }
  cache.set(key, { buffer, contentType: 'image/webp', createdAt: Date.now() });
  cacheBytes += buffer.length;
}

async function readLimited(response: globalThis.Response): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_SOURCE_BYTES) throw new UpstreamError(502);
  if (!response.body) return Buffer.alloc(0);

  const chunks: Uint8Array[] = [];
  let received = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_SOURCE_BYTES) {
      await reader.cancel();
      throw new UpstreamError(502);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function optimize(fullUrl: string, width: number, quality: number): Promise<Buffer> {
  let response: globalThis.Response;
  try {
    response = await fetch(fullUrl, { redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  } catch {
    throw new UpstreamError(502);
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new UpstreamError(response.status === 404 ? 404 : 502);
  }

  const originalBuffer = await readLimited(response);

  // Process with sharp
  let pipeline = sharp(originalBuffer, { limitInputPixels: MAX_INPUT_PIXELS });

  if (width > 0) {
    pipeline = pipeline.resize(width, undefined, { withoutEnlargement: true });
  }

  // Convert to WebP
  pipeline = pipeline.webp({ quality });

  return pipeline.toBuffer();
}

export function registerImageOptimizer(app: Express, apiUrl: string): void {
  app.get('/_img', async (req: Request, res: Response) => {
    try {
      const url = req.query['url'];
      const w = parseInt(req.query['w'] as string, 10) || 0;
      const q = parseInt(req.query['q'] as string, 10) || 75;

      if (!url || typeof url !== 'string') {
        res.status(400).send('Missing url param');
        return;
      }

      // Only allow images from our API origin
      const fullUrl = resolveApiUrl(url, apiUrl);
      if (!fullUrl) {
        res.status(403).send('Forbidden origin');
        return;
      }

      const width = w ? clampWidth(w) : 0;
      const quality = clampQuality(q);
      const cacheKey = `${fullUrl}|${width}|${quality}`;

      // Check cache
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('X-Image-Cache', 'HIT');
        res.send(cached.buffer);
        return;
      }

      // Concurrent identical requests share one fetch + resize
      let pending = inFlight.get(cacheKey);
      if (!pending) {
        pending = optimize(fullUrl, width, quality)
          .then((optimized) => {
            cacheSet(cacheKey, optimized);
            return optimized;
          })
          .finally(() => inFlight.delete(cacheKey));
        inFlight.set(cacheKey, pending);
      }
      const optimized = await pending;

      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Image-Cache', 'MISS');
      res.send(optimized);
    } catch (err) {
      if (err instanceof UpstreamError) {
        res.status(err.status).send(err.status === 404 ? 'Not found' : 'Upstream error');
        return;
      }
      res.status(500).send('Image processing failed');
    }
  });
}
