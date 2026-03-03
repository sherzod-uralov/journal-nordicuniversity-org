import type { Express, Request, Response } from 'express';
import sharp from 'sharp';

interface ImageCache {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const cache = new Map<string, ImageCache>();
const MAX_CACHE = 500;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];
const ALLOWED_QUALITIES = [10, 20, 40, 60, 75, 85, 100];

function clampWidth(w: number): number {
  return ALLOWED_WIDTHS.find(a => a >= w) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

function clampQuality(q: number): number {
  return ALLOWED_QUALITIES.find(a => a >= q) ?? 75;
}

export function registerImageOptimizer(app: Express, apiUrl: string): void {
  app.get('/_img', async (req: Request, res: Response) => {
    try {
      const url = req.query['url'] as string;
      const w = parseInt(req.query['w'] as string, 10) || 0;
      const q = parseInt(req.query['q'] as string, 10) || 75;

      if (!url) {
        res.status(400).send('Missing url param');
        return;
      }

      // Only allow images from our API
      const fullUrl = url.startsWith('http') ? url : `${apiUrl}/${url.replace(/^\/+/, '')}`;
      if (!fullUrl.startsWith(apiUrl)) {
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

      // Fetch original
      const response = await fetch(fullUrl);
      if (!response.ok) {
        res.status(response.status).send('Upstream error');
        return;
      }

      const originalBuffer = Buffer.from(await response.arrayBuffer());

      // Process with sharp
      let pipeline = sharp(originalBuffer);

      if (width > 0) {
        pipeline = pipeline.resize(width, undefined, { withoutEnlargement: true });
      }

      // Convert to WebP
      pipeline = pipeline.webp({ quality });

      const optimized = await pipeline.toBuffer();

      // Cache result
      if (cache.size >= MAX_CACHE) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      cache.set(cacheKey, {
        buffer: optimized,
        contentType: 'image/webp',
        createdAt: Date.now(),
      });

      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Image-Cache', 'MISS');
      res.send(optimized);
    } catch {
      res.status(500).send('Image processing failed');
    }
  });
}
