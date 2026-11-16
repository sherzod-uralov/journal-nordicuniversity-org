import type { Application, Response } from 'express';
import { sitemapIndexXsl, URLSET_XSL } from './sitemap-xsl';

const SITEMAP_TTL = 86_400_000;
const FETCH_TIMEOUT = 15_000;
// Last good copy per sitemap; kept after expiry so API outages serve stale data instead of an empty urlset.
const sitemapCache = new Map<string, { xml: string; createdAt: number }>();
const inFlight = new Map<string, Promise<string>>();

function regenerate(key: string, generate: () => Promise<string>): Promise<string> {
  let pending = inFlight.get(key);
  if (!pending) {
    pending = generate()
      .then((xml) => {
        sitemapCache.set(key, { xml, createdAt: Date.now() });
        return xml;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

/** Serves the cached sitemap (refreshing it in the background when expired), or 503 if none could be built. */
function serveSitemap(res: Response, key: string, generate: () => Promise<string>): void {
  const entry = sitemapCache.get(key);
  if (entry) {
    if (Date.now() - entry.createdAt > SITEMAP_TTL) {
      regenerate(key, generate).catch((err) => console.error(`Sitemap ${key}.xml refresh error:`, err));
    }
    res.set('Content-Type', 'application/xml');
    res.send(entry.xml);
    return;
  }

  regenerate(key, generate)
    .then((xml) => {
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    })
    .catch((err) => {
      console.error(`Sitemap ${key}.xml error:`, err);
      res.status(503).set('Retry-After', '300').type('text/plain').send(`Failed to generate ${key} sitemap`);
    });
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${url} responded ${res.status}`);
  }
  return res.json();
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&${({ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' } as Record<string, string>)[c]};`);
}

/** Today's date when `date` is missing; null (no <lastmod>) when it is not a valid date. */
function toDateStr(date: string | undefined): string | null {
  const parsed = date ? new Date(date) : new Date();
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function buildUrlEntry(loc: string, lastmod?: string, changefreq = 'monthly', priority = '0.5'): string {
  const date = toDateStr(lastmod);
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${date ? `    <lastmod>${date}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function wrapUrlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/urlset.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}

export function registerSitemap(app: Application, siteUrl: string, apiUrl: string): void {
  app.get('/sitemap.xsl', (_req, res) => {
    res.set('Content-Type', 'application/xml');
    res.send(sitemapIndexXsl(siteUrl));
  });

  app.get('/urlset.xsl', (_req, res) => {
    res.set('Content-Type', 'application/xml');
    res.send(URLSET_XSL);
  });

  app.get('/sitemap.xml', (_req, res) => {
    const now = toDateStr(undefined);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${siteUrl}/static.xml`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${siteUrl}/articles.xml`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${siteUrl}/news.xml`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });

  app.get('/static.xml', (_req, res) => {
    serveSitemap(res, 'static', async () => {
      const [volumesData, categoriesData] = await Promise.all([
        fetchJson(`${apiUrl}/volume`),
        fetchJson(`${apiUrl}/category`),
      ]);

      const entries: string[] = [
        buildUrlEntry(`${siteUrl}/`, undefined, 'daily', '1.0'),
        buildUrlEntry(`${siteUrl}/articles`, undefined, 'daily', '0.9'),
        buildUrlEntry(`${siteUrl}/volumes`, undefined, 'weekly', '0.8'),
        buildUrlEntry(`${siteUrl}/categories`, undefined, 'weekly', '0.8'),
        buildUrlEntry(`${siteUrl}/news`, undefined, 'daily', '0.8'),
        buildUrlEntry(`${siteUrl}/about`, undefined, 'monthly', '0.5'),
        buildUrlEntry(`${siteUrl}/guidelines`, undefined, 'monthly', '0.5'),
      ];

      const volumes = volumesData?.data ?? volumesData ?? [];
      for (const v of Array.isArray(volumes) ? volumes : []) {
        if (v?.id == null) continue;
        entries.push(buildUrlEntry(`${siteUrl}/volumes/${encodeURIComponent(v.id)}`, v.updatedAt, 'monthly', '0.6'));
      }

      const categories = categoriesData?.data ?? categoriesData ?? [];
      for (const c of Array.isArray(categories) ? categories : []) {
        if (c?.id == null) continue;
        entries.push(buildUrlEntry(`${siteUrl}/categories/${encodeURIComponent(c.id)}`, c.updatedAt, 'monthly', '0.6'));
      }

      return wrapUrlset(entries);
    });
  });

  app.get('/articles.xml', (_req, res) => {
    serveSitemap(res, 'articles', async () => {
      const articlesData = await fetchJson(`${apiUrl}/article?page=1&limit=9999`);
      const articles = articlesData?.data ?? articlesData ?? [];

      const entries: string[] = [];
      for (const a of Array.isArray(articles) ? articles : []) {
        if (a?.slug) {
          entries.push(buildUrlEntry(`${siteUrl}/article/${encodeURIComponent(a.slug)}`, a.updatedAt, 'monthly', '0.7'));
        }
      }

      return wrapUrlset(entries);
    });
  });

  app.get('/news.xml', (_req, res) => {
    serveSitemap(res, 'news', async () => {
      const newsData = await fetchJson(`${apiUrl}/news/list?lang=uz&page=1&limit=9999`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const news = newsData?.data ?? newsData ?? [];

      const entries: string[] = [];
      for (const n of Array.isArray(news) ? news : []) {
        if (n?.slug) {
          entries.push(buildUrlEntry(`${siteUrl}/news/${encodeURIComponent(n.slug)}`, n.updatedAt, 'weekly', '0.6'));
        }
      }

      return wrapUrlset(entries);
    });
  });
}
