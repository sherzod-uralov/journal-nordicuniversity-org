import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { ArticleSeoData, SeoService } from './seo.service';

const article: ArticleSeoData = {
  title: 'Test article',
  abstract: 'Abstract text',
  authors: [
    { name: 'Alice', orcid: '0000-0001' },
    { name: 'Bob' },
    { name: 'Carol', orcid: '0000-0003' },
  ],
  keywords: ['a', 'b'],
  journalTitle: 'Journal',
  articleUrl: 'https://journal.nordicuniversity.org/articles/test',
  publishDate: '2026-01-15',
};

describe('SeoService', () => {
  let events: Subject<RouterEvent>;
  let doc: Document;

  function create(responseInit?: ResponseInit): SeoService {
    events = new Subject<RouterEvent>();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events, url: '/current' } },
        ...(responseInit ? [{ provide: RESPONSE_INIT, useValue: responseInit }] : []),
      ],
    });
    doc = TestBed.inject(DOCUMENT);
    return TestBed.inject(SeoService);
  }

  const count = (selector: string) => doc.head.querySelectorAll(selector).length;
  const robots = () => [...doc.head.querySelectorAll('meta[name="robots"]')].map((m) => m.getAttribute('content'));

  afterEach(() => {
    doc?.head.querySelectorAll('meta, link[rel="canonical"], script[type="application/ld+json"]').forEach((el) => el.remove());
  });

  it('resetMeta removes every citation_author / article:author tag, JSON-LD and canonical', () => {
    const seo = create();
    seo.setArticleSeo(article);
    expect(count('meta[name="citation_author"]')).toBe(3);
    expect(count('meta[name="citation_author_orcid"]')).toBe(2);
    expect(count('meta[property="article:author"]')).toBe(3);
    expect(count('meta[property="article:tag"]')).toBe(2);
    expect(count('script[type="application/ld+json"]')).toBe(1);
    expect(count('link[rel="canonical"]')).toBe(1);

    seo.resetMeta();

    expect(count('meta[name="citation_author"]')).toBe(0);
    expect(count('meta[name="citation_author_orcid"]')).toBe(0);
    expect(count('meta[name^="citation_"]')).toBe(0);
    expect(count('meta[name^="DC."]')).toBe(0);
    expect(count('meta[property="article:author"]')).toBe(0);
    expect(count('meta[property="article:tag"]')).toBe(0);
    expect(count('script[type="application/ld+json"]')).toBe(0);
    expect(count('link[rel="canonical"]')).toBe(0);
  });

  it('a second article does not accumulate authors from the first after resetMeta', () => {
    const seo = create();
    seo.setArticleSeo(article);
    seo.resetMeta();
    seo.setArticleSeo({ ...article, authors: [{ name: 'Dave' }] });
    const authors = [...doc.head.querySelectorAll('meta[name="citation_author"]')].map((m) => m.getAttribute('content'));
    expect(authors).toEqual(['Dave']);
  });

  it('markNotFound adds a single robots noindex tag and sets status 404 when RESPONSE_INIT is provided', () => {
    const responseInit: ResponseInit = { status: 200 };
    const seo = create(responseInit);
    seo.markNotFound();
    seo.markNotFound();
    expect(responseInit.status).toBe(404);
    expect(robots()).toEqual(['noindex']);
  });

  it('markNotFound works without RESPONSE_INIT (browser)', () => {
    const seo = create();
    expect(() => seo.markNotFound()).not.toThrow();
    expect(robots()).toEqual(['noindex']);
  });

  it('keeps noindex for update() in the same navigation, clears it on the next navigation', () => {
    const seo = create();
    seo.markNotFound();

    // The 404 page sets its title via update() right after markNotFound()
    seo.update({ title: 'Not found' });
    expect(robots()).toEqual(['noindex']);

    // Unrelated router events don't reset the flag
    events.next(new NavigationEnd(1, '/missing', '/missing'));
    seo.update({ title: 'Still not found' });
    expect(robots()).toEqual(['noindex']);

    events.next(new NavigationStart(2, '/articles'));
    seo.update({ title: 'Articles' });
    expect(robots()).toEqual([]);
  });

  it('resetMeta on the next navigation clears noindex', () => {
    const seo = create();
    seo.markNotFound();
    events.next(new NavigationStart(2, '/'));
    seo.resetMeta();
    expect(robots()).toEqual([]);
  });

  it('update() sets title, og:url from the router url and canonical', () => {
    const seo = create();
    seo.update({ title: 'Home', description: 'Desc' });
    expect(doc.title).toBe('Home | International Nordic University Scientific Journal');
    expect(doc.head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://journal.nordicuniversity.org/current',
    );
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://journal.nordicuniversity.org/current',
    );
  });
});
