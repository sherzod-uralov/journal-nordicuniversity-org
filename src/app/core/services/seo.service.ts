import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

export interface SeoData {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  ogUrl?: string;
}

export interface ArticleSeoData {
  title: string;
  abstract: string;
  authors: { name: string; orcid?: string }[];
  doi?: string;
  publishDate?: string;
  journalTitle: string;
  volume?: string;
  firstPage?: number;
  lastPage?: number;
  keywords?: string[];
  pdfUrl?: string;
  articleUrl: string;
  imageUrl?: string;
  issn?: string;
  language?: string;
  publisher?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  private readonly defaultTitle = 'International Nordic University Scientific Journal';
  private readonly journalTitle = 'International Nordic University Scientific Journal';
  private readonly publisher = 'International Nordic University';
  private readonly siteUrl = 'https://journal.nordicuniversity.org';
  private readonly defaultImage = 'https://journal.nordicuniversity.org/og-image.png';

  private addedMetaTags: string[] = [];

  /** Build a full URL from the current route path */
  getFullUrl(path?: string): string {
    return `${this.siteUrl}${path || this.router.url}`;
  }

  update(data: SeoData): void {
    this.title.setTitle(data.title ? `${data.title} | ${this.defaultTitle}` : this.defaultTitle);

    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
      this.meta.updateTag({ property: 'og:description', content: data.description });
    }

    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    const ogUrl = data.ogUrl || this.getFullUrl();
    const ogImage = data.ogImage || this.defaultImage;

    this.meta.updateTag({ property: 'og:title', content: data.title || this.defaultTitle });
    this.meta.updateTag({ property: 'og:type', content: data.ogType || 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.journalTitle });
    this.meta.updateTag({ property: 'og:url', content: ogUrl });
    this.meta.updateTag({ property: 'og:image', content: ogImage });

    this.meta.updateTag({ name: 'twitter:card', content: data.ogImage ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title || this.defaultTitle });
    if (data.description) {
      this.meta.updateTag({ name: 'twitter:description', content: data.description });
    }
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    this.updateCanonical(data.canonicalUrl || ogUrl);
  }

  /**
   * Full academic SEO for article pages:
   * - Google Scholar (Highwire Press) meta tags
   * - Dublin Core meta tags
   * - Open Graph (article)
   * - Twitter Card
   * - JSON-LD ScholarlyArticle structured data
   */
  setArticleSeo(data: ArticleSeoData): void {
    // --- Page title ---
    this.title.setTitle(`${data.title} | ${this.journalTitle}`);

    // --- Basic meta ---
    this.meta.updateTag({ name: 'description', content: data.abstract.substring(0, 300) });
    if (data.keywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords.join(', ') });
    }
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // --- Google Scholar / Highwire Press tags ---
    this.setMeta('citation_title', data.title);
    this.setMeta('citation_journal_title', data.journalTitle);
    this.setMeta('citation_journal_abbrev', 'Int. Nord. Univ. Sci. J.');
    this.setMeta('citation_publisher', data.publisher || this.publisher);

    if (data.language) {
      this.setMeta('citation_language', data.language);
    }

    // Authors
    for (const author of data.authors) {
      this.addMeta('citation_author', author.name);
      if (author.orcid) {
        this.addMeta('citation_author_orcid', author.orcid);
      }
    }

    if (data.publishDate) {
      const d = new Date(data.publishDate);
      const formatted = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      this.setMeta('citation_publication_date', formatted);
      this.setMeta('citation_date', formatted);
      this.setMeta('citation_online_date', formatted);
    }

    if (data.doi) {
      this.setMeta('citation_doi', data.doi);
    }

    if (data.volume) {
      this.setMeta('citation_volume', data.volume);
    }

    if (data.firstPage) {
      this.setMeta('citation_firstpage', String(data.firstPage));
    }
    if (data.lastPage) {
      this.setMeta('citation_lastpage', String(data.lastPage));
    }

    if (data.pdfUrl) {
      this.setMeta('citation_pdf_url', data.pdfUrl);
    }

    this.setMeta('citation_fulltext_html_url', data.articleUrl);
    this.setMeta('citation_abstract_html_url', data.articleUrl);

    if (data.keywords?.length) {
      this.setMeta('citation_keywords', data.keywords.join('; '));
    }

    if (data.abstract) {
      this.setMeta('citation_abstract', data.abstract);
    }

    if (data.issn) {
      this.setMeta('citation_issn', data.issn);
    }

    // --- Dublin Core meta tags ---
    this.setMeta('DC.title', data.title);
    this.setMeta('DC.creator', data.authors.map(a => a.name).join('; '));
    this.setMeta('DC.subject', data.keywords?.join('; ') || '');
    this.setMeta('DC.description', data.abstract.substring(0, 300));
    this.setMeta('DC.publisher', data.publisher || this.publisher);
    this.setMeta('DC.type', 'Text.Article');
    this.setMeta('DC.format', 'text/html');
    if (data.publishDate) {
      this.setMeta('DC.date', new Date(data.publishDate).toISOString().split('T')[0]);
    }
    if (data.doi) {
      this.setMeta('DC.identifier', `doi:${data.doi}`);
    }
    this.setMeta('DC.source', data.journalTitle);
    if (data.language) {
      this.setMeta('DC.language', data.language);
    }
    this.setMeta('DC.rights', `Copyright (c) ${new Date().getFullYear()} ${this.publisher}`);

    // --- PRISM (Publishing Requirements for Industry Standard Metadata) ---
    this.setMeta('prism.publicationName', data.journalTitle);
    if (data.doi) {
      this.setMeta('prism.doi', data.doi);
    }
    if (data.publishDate) {
      this.setMeta('prism.publicationDate', new Date(data.publishDate).toISOString().split('T')[0]);
    }
    if (data.volume) {
      this.setMeta('prism.volume', data.volume);
    }
    if (data.firstPage) {
      this.setMeta('prism.startingPage', String(data.firstPage));
    }
    if (data.lastPage) {
      this.setMeta('prism.endingPage', String(data.lastPage));
    }

    // --- Open Graph (article type) ---
    const ogImage = data.imageUrl || this.defaultImage;
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.abstract.substring(0, 200) });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:url', content: data.articleUrl });
    this.meta.updateTag({ property: 'og:site_name', content: this.journalTitle });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    if (data.publishDate) {
      this.meta.updateTag({ property: 'article:published_time', content: new Date(data.publishDate).toISOString() });
    }
    for (const author of data.authors) {
      this.addMetaProperty('article:author', author.name);
    }
    if (data.keywords?.length) {
      for (const tag of data.keywords) {
        this.addMetaProperty('article:tag', tag);
      }
    }

    // --- Twitter Card ---
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.abstract.substring(0, 200) });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // --- Canonical URL ---
    this.updateCanonical(data.articleUrl);

    // --- JSON-LD ScholarlyArticle ---
    this.setArticleJsonLd(data);
  }

  private setArticleJsonLd(data: ArticleSeoData): void {
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      'headline': data.title,
      'name': data.title,
      'description': data.abstract,
      'author': data.authors.map(a => {
        const author: Record<string, unknown> = {
          '@type': 'Person',
          'name': a.name,
        };
        if (a.orcid) {
          author['sameAs'] = `https://orcid.org/${a.orcid}`;
        }
        return author;
      }),
      'publisher': {
        '@type': 'Organization',
        'name': this.publisher,
        'url': this.siteUrl,
      },
      'isPartOf': {
        '@type': 'Periodical',
        'name': this.journalTitle,
        ...(data.issn ? { 'issn': data.issn } : {}),
      },
      'url': data.articleUrl,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': data.articleUrl,
      },
    };

    if (data.publishDate) {
      jsonLd['datePublished'] = new Date(data.publishDate).toISOString().split('T')[0];
    }
    jsonLd['dateModified'] = jsonLd['datePublished'] || new Date().toISOString().split('T')[0];

    if (data.doi) {
      jsonLd['sameAs'] = `https://doi.org/${data.doi}`;
      jsonLd['identifier'] = {
        '@type': 'PropertyValue',
        'propertyID': 'doi',
        'value': data.doi,
      };
    }

    if (data.imageUrl) {
      jsonLd['image'] = data.imageUrl;
      jsonLd['thumbnailUrl'] = data.imageUrl;
    }

    if (data.keywords?.length) {
      jsonLd['keywords'] = data.keywords.join(', ');
      jsonLd['about'] = data.keywords.map(k => ({
        '@type': 'Thing',
        'name': k,
      }));
    }

    if (data.volume) {
      jsonLd['isPartOf'] = {
        '@type': 'PublicationVolume',
        'volumeNumber': data.volume,
        'isPartOf': {
          '@type': 'Periodical',
          'name': this.journalTitle,
          ...(data.issn ? { 'issn': data.issn } : {}),
        },
      };
    }

    if (data.firstPage) {
      jsonLd['pageStart'] = String(data.firstPage);
    }
    if (data.lastPage) {
      jsonLd['pageEnd'] = String(data.lastPage);
    }
    if (data.firstPage && data.lastPage) {
      jsonLd['pagination'] = `${data.firstPage}-${data.lastPage}`;
    }

    if (data.pdfUrl) {
      jsonLd['encoding'] = {
        '@type': 'MediaObject',
        'contentUrl': data.pdfUrl,
        'encodingFormat': 'application/pdf',
      };
    }

    jsonLd['inLanguage'] = data.language || 'en';
    jsonLd['creativeWorkStatus'] = 'Published';
    jsonLd['isAccessibleForFree'] = true;

    this.setJsonLd(jsonLd);
  }

  setJsonLd(data: Record<string, unknown>): void {
    let script: HTMLScriptElement | null = this.doc.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  private updateCanonical(url: string): void {
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /** Set a single meta tag (name=value), tracking for cleanup */
  private setMeta(name: string, content: string): void {
    if (!content) return;
    this.meta.updateTag({ name, content });
    if (!this.addedMetaTags.includes(name)) {
      this.addedMetaTags.push(name);
    }
  }

  /** Add a meta tag (allows duplicates like citation_author) */
  private addMeta(name: string, content: string): void {
    if (!content) return;
    this.meta.addTag({ name, content });
    if (!this.addedMetaTags.includes(name)) {
      this.addedMetaTags.push(name);
    }
  }

  /** Add a property meta tag (allows duplicates like article:author) */
  private addMetaProperty(property: string, content: string): void {
    if (!content) return;
    this.meta.addTag({ property, content });
    if (!this.addedMetaTags.includes(`property:${property}`)) {
      this.addedMetaTags.push(`property:${property}`);
    }
  }

  resetMeta(): void {
    this.title.setTitle(this.defaultTitle);

    // Remove all tracked meta tags
    for (const tag of this.addedMetaTags) {
      if (tag.startsWith('property:')) {
        const prop = tag.replace('property:', '');
        this.meta.removeTag(`property="${prop}"`);
      } else {
        this.meta.removeTag(`name="${tag}"`);
      }
    }
    this.addedMetaTags = [];

    // Remove specific OG/Twitter article tags
    this.meta.removeTag('property="article:published_time"');
    this.meta.removeTag('property="article:author"');
    this.meta.removeTag('property="article:tag"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');

    // Remove JSON-LD
    const script = this.doc.querySelector('script[type="application/ld+json"]');
    if (script) {
      script.remove();
    }

    // Remove canonical
    const canonical = this.doc.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.remove();
    }

    // Reset basic OG
    this.meta.updateTag({ property: 'og:title', content: this.defaultTitle });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:url"');
  }
}
