export function sitemapIndexXsl(siteUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" indent="yes" encoding="UTF-8"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap - International Nordic University Scientific Journal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #0d1b2a;
            color: #e0e1dd;
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 24px;
          }
          .header {
            text-align: center;
            margin-bottom: 48px;
          }
          .header svg {
            width: 48px;
            height: 48px;
            margin-bottom: 20px;
            opacity: 0.7;
          }
          .header h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 32px;
            font-weight: 700;
            color: #e0e1dd;
            margin-bottom: 8px;
          }
          .header p {
            color: #778da9;
            font-size: 15px;
            line-height: 1.6;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(65, 90, 119, 0.25);
            border: 1px solid rgba(119, 141, 169, 0.2);
            color: #778da9;
            font-size: 12px;
            font-weight: 500;
            padding: 4px 12px;
            border-radius: 20px;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .badge-dot {
            width: 6px;
            height: 6px;
            background: #4ade80;
            border-radius: 50%;
          }
          .cards {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .card {
            background: #1b263b;
            border: 1px solid rgba(119, 141, 169, 0.15);
            border-radius: 12px;
            padding: 24px 28px;
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            gap: 20px;
            transition: all 0.2s ease;
          }
          .card:hover {
            border-color: rgba(119, 141, 169, 0.4);
            background: #1f2d45;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }
          .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .card-icon svg {
            width: 24px;
            height: 24px;
          }
          .card-icon.static { background: rgba(99, 102, 241, 0.15); }
          .card-icon.static svg { stroke: #818cf8; }
          .card-icon.articles { background: rgba(34, 197, 94, 0.15); }
          .card-icon.articles svg { stroke: #4ade80; }
          .card-icon.news { background: rgba(251, 146, 60, 0.15); }
          .card-icon.news svg { stroke: #fb923c; }
          .card-body { flex: 1; min-width: 0; }
          .card-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 18px;
            font-weight: 600;
            color: #e0e1dd;
            margin-bottom: 4px;
          }
          .card-desc {
            font-size: 13px;
            color: #778da9;
            line-height: 1.5;
          }
          .card-meta {
            text-align: right;
            flex-shrink: 0;
          }
          .card-date {
            font-size: 12px;
            color: #778da9;
            white-space: nowrap;
          }
          .card-arrow {
            color: #415a77;
            font-size: 18px;
            margin-left: 8px;
            transition: transform 0.2s ease;
          }
          .card:hover .card-arrow {
            transform: translateX(4px);
            color: #778da9;
          }
          .footer {
            text-align: center;
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid rgba(119, 141, 169, 0.1);
            color: #415a77;
            font-size: 13px;
          }
          .footer a {
            color: #778da9;
            text-decoration: none;
          }
          .footer a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge"><span class="badge-dot"></span> XML Sitemap</div>
            <h1>International Nordic University Scientific Journal</h1>
            <p>
              This sitemap contains <strong><xsl:value-of select="count(sm:sitemapindex/sm:sitemap)"/></strong>
              sub-sitemaps for search engine indexing.
            </p>
          </div>
          <div class="cards">
            <xsl:for-each select="sm:sitemapindex/sm:sitemap">
              <xsl:variable name="url" select="sm:loc"/>
              <xsl:variable name="filename">
                <xsl:call-template name="filename">
                  <xsl:with-param name="path" select="sm:loc"/>
                </xsl:call-template>
              </xsl:variable>
              <a class="card" href="{sm:loc}">
                <div>
                  <xsl:attribute name="class">
                    card-icon <xsl:choose>
                      <xsl:when test="contains(sm:loc, 'static')">static</xsl:when>
                      <xsl:when test="contains(sm:loc, 'articles')">articles</xsl:when>
                      <xsl:when test="contains(sm:loc, 'news')">news</xsl:when>
                      <xsl:otherwise>static</xsl:otherwise>
                    </xsl:choose>
                  </xsl:attribute>
                  <xsl:choose>
                    <xsl:when test="contains(sm:loc, 'static')">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12L11.204 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
                    </xsl:when>
                    <xsl:when test="contains(sm:loc, 'articles')">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                    </xsl:when>
                    <xsl:when test="contains(sm:loc, 'news')">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"/></svg>
                    </xsl:when>
                    <xsl:otherwise>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                    </xsl:otherwise>
                  </xsl:choose>
                </div>
                <div class="card-body">
                  <div class="card-title">
                    <xsl:choose>
                      <xsl:when test="contains(sm:loc, 'static')">Static Pages</xsl:when>
                      <xsl:when test="contains(sm:loc, 'articles')">Articles</xsl:when>
                      <xsl:when test="contains(sm:loc, 'news')">News</xsl:when>
                      <xsl:otherwise><xsl:value-of select="$filename"/></xsl:otherwise>
                    </xsl:choose>
                  </div>
                  <div class="card-desc">
                    <xsl:choose>
                      <xsl:when test="contains(sm:loc, 'static')">Main pages, volumes, and categories</xsl:when>
                      <xsl:when test="contains(sm:loc, 'articles')">All published research articles</xsl:when>
                      <xsl:when test="contains(sm:loc, 'news')">Latest news and announcements</xsl:when>
                    </xsl:choose>
                  </div>
                </div>
                <div class="card-meta">
                  <div class="card-date"><xsl:value-of select="sm:lastmod"/></div>
                </div>
                <span class="card-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                </span>
              </a>
            </xsl:for-each>
          </div>
          <div class="footer">
            <a href="${siteUrl}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="vertical-align: -2px; margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
              Back to International Nordic University Scientific Journal
            </a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
  <xsl:template name="filename">
    <xsl:param name="path"/>
    <xsl:choose>
      <xsl:when test="contains($path, '/')">
        <xsl:call-template name="filename">
          <xsl:with-param name="path" select="substring-after($path, '/')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise><xsl:value-of select="$path"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>`;
}

export const URLSET_XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" indent="yes" encoding="UTF-8"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap - International Nordic University Scientific Journal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400&amp;display=swap" rel="stylesheet"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #0d1b2a;
            color: #e0e1dd;
            min-height: 100vh;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 48px 24px;
          }
          .back {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #778da9;
            text-decoration: none;
            font-size: 14px;
            margin-bottom: 32px;
            transition: color 0.2s;
          }
          .back:hover { color: #e0e1dd; }
          .header {
            margin-bottom: 32px;
          }
          .header h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 28px;
            font-weight: 700;
            color: #e0e1dd;
            margin-bottom: 8px;
          }
          .stats {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }
          .stat {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(65, 90, 119, 0.2);
            border: 1px solid rgba(119, 141, 169, 0.15);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 13px;
            color: #778da9;
          }
          .stat strong {
            color: #e0e1dd;
            font-weight: 600;
          }
          .table-wrap {
            background: #1b263b;
            border: 1px solid rgba(119, 141, 169, 0.12);
            border-radius: 12px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            text-align: left;
            padding: 14px 20px;
            font-size: 11px;
            font-weight: 600;
            color: #415a77;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px solid rgba(119, 141, 169, 0.1);
            background: rgba(13, 27, 42, 0.4);
          }
          tbody tr {
            border-bottom: 1px solid rgba(119, 141, 169, 0.06);
            transition: background 0.15s;
          }
          tbody tr:last-child { border-bottom: none; }
          tbody tr:hover { background: rgba(65, 90, 119, 0.1); }
          tbody td {
            padding: 12px 20px;
            font-size: 13px;
            vertical-align: middle;
          }
          .url-cell {
            max-width: 500px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .url-cell a {
            color: #778da9;
            text-decoration: none;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12.5px;
            transition: color 0.2s;
          }
          .url-cell a:hover { color: #e0e1dd; }
          .date-cell {
            color: #778da9;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .freq-cell {
            color: #415a77;
          }
          .priority-cell {
            font-weight: 500;
            font-variant-numeric: tabular-nums;
          }
          .priority-high { color: #4ade80; }
          .priority-mid { color: #fbbf24; }
          .priority-low { color: #415a77; }
          .row-num {
            color: #415a77;
            font-size: 12px;
            font-variant-numeric: tabular-nums;
            text-align: right;
            width: 40px;
          }
          @media (max-width: 768px) {
            .hide-mobile { display: none; }
            tbody td, thead th { padding: 10px 12px; }
            .url-cell { max-width: 260px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <a class="back" href="/sitemap.xml">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            All Sitemaps
          </a>
          <div class="header">
            <h1>URL Sitemap</h1>
            <div class="stats">
              <div class="stat">
                URLs: <strong><xsl:value-of select="count(sm:urlset/sm:url)"/></strong>
              </div>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width:40px">#</th>
                  <th>URL</th>
                  <th class="hide-mobile">Last Modified</th>
                  <th class="hide-mobile">Freq</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:urlset/sm:url">
                  <tr>
                    <td class="row-num"><xsl:value-of select="position()"/></td>
                    <td class="url-cell">
                      <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                    </td>
                    <td class="date-cell hide-mobile"><xsl:value-of select="sm:lastmod"/></td>
                    <td class="freq-cell hide-mobile"><xsl:value-of select="sm:changefreq"/></td>
                    <td>
                      <xsl:attribute name="class">
                        priority-cell <xsl:choose>
                          <xsl:when test="sm:priority &gt;= 0.8">priority-high</xsl:when>
                          <xsl:when test="sm:priority &gt;= 0.5">priority-mid</xsl:when>
                          <xsl:otherwise>priority-low</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="sm:priority"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;
