import type { Application } from 'express';
import { sitemapIndexXsl, URLSET_XSL } from './sitemap-xsl';

const SITEMAP_TTL = 86_400_000;
const sitemapCache = new Map<string, { xml: string; createdAt: number }>();

function getCached(key: string): string | null {
  const entry = sitemapCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > SITEMAP_TTL) {
    sitemapCache.delete(key);
    return null;
  }
  return entry.xml;
}

function setCache(key: string, xml: string): void {
  sitemapCache.set(key, { xml, createdAt: Date.now() });
}

function toDateStr(date: string | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

function buildUrlEntry(loc: string, lastmod?: string, changefreq = 'monthly', priority = '0.5'): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${toDateStr(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
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
    <loc>${siteUrl}/static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/articles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/news.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });

  app.get('/static.xml', async (_req, res): Promise<void> => {
    const cached = getCached('static');
    if (cached) {
      res.set('Content-Type', 'application/xml');
      res.send(cached);
      return;
    }

    try {
      const [volumesRes, categoriesRes] = await Promise.all([
        fetch(`${apiUrl}/volume`),
        fetch(`${apiUrl}/category`),
      ]);

      const volumesData = await volumesRes.json() as any;
      const categoriesData = await categoriesRes.json() as any;

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
        entries.push(buildUrlEntry(`${siteUrl}/volumes/${v.id}`, v.updatedAt, 'monthly', '0.6'));
      }

      const categories = categoriesData?.data ?? categoriesData ?? [];
      for (const c of Array.isArray(categories) ? categories : []) {
        entries.push(buildUrlEntry(`${siteUrl}/categories/${c.id}`, c.updatedAt, 'monthly', '0.6'));
      }

      const xml = wrapUrlset(entries);
      setCache('static', xml);
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      console.error('Sitemap static.xml error:', err);
      res.status(500).send('Failed to generate static sitemap');
    }
  });

  app.get('/articles.xml', async (_req, res): Promise<void> => {
    const cached = getCached('articles');
    if (cached) {
      res.set('Content-Type', 'application/xml');
      res.send(cached);
      return;
    }

    try {
      const articlesRes = await fetch(`${apiUrl}/article?page=1&limit=9999`);
      const articlesData = await articlesRes.json() as any;
      const articles = articlesData?.data ?? articlesData ?? [];

      const entries: string[] = [];
      for (const a of Array.isArray(articles) ? articles : []) {
        if (a.slug) {
          entries.push(buildUrlEntry(`${siteUrl}/articles/${a.slug}`, a.updatedAt, 'monthly', '0.7'));
        }
      }

      const xml = wrapUrlset(entries);
      setCache('articles', xml);
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      console.error('Sitemap articles.xml error:', err);
      res.status(500).send('Failed to generate articles sitemap');
    }
  });

  app.get('/news.xml', async (_req, res): Promise<void> => {
    const cached = getCached('news');
    if (cached) {
      res.set('Content-Type', 'application/xml');
      res.send(cached);
      return;
    }

    try {
      const newsRes = await fetch(`${apiUrl}/news/list?lang=uz&page=1&limit=9999`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const newsData = await newsRes.json() as any;
      const news = newsData?.data ?? newsData ?? [];

      const entries: string[] = [];
      for (const n of Array.isArray(news) ? news : []) {
        if (n.slug) {
          entries.push(buildUrlEntry(`${siteUrl}/news/${n.slug}`, n.updatedAt, 'weekly', '0.6'));
        }
      }

      const xml = wrapUrlset(entries);
      setCache('news', xml);
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      console.error('Sitemap news.xml error:', err);
      res.status(500).send('Failed to generate news sitemap');
    }
  });
}
