import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Article } from '@core/models/article.model';
import { ArticleApiService } from '@services/api/article-api.service';
import { ArticleStore } from './article.store';

const article = (slug: string) => ({ id: `id-${slug}`, slug, title: slug.toUpperCase() }) as unknown as Article;

describe('ArticleStore.loadBySlug', () => {
  let requests: Record<string, Subject<Article>>;
  let getBySlug: ReturnType<typeof vi.fn>;
  let store: InstanceType<typeof ArticleStore>;

  beforeEach(() => {
    requests = {};
    getBySlug = vi.fn((slug: string) => (requests[slug] = new Subject<Article>()));
    TestBed.configureTestingModule({
      providers: [{ provide: ArticleApiService, useValue: { getBySlug } }],
    });
    store = TestBed.inject(ArticleStore);
  });

  it('sets loading and then the selected article', () => {
    store.loadBySlug('a');
    expect(store.loading()).toBe(true);
    expect(store.selectedArticle()).toBeNull();

    requests['a'].next(article('a'));
    expect(store.selectedArticle()?.slug).toBe('a');
    expect(store.loading()).toBe(false);
    expect(store.notFound()).toBe(false);
  });

  it('clears the previous article as soon as a different slug is requested', () => {
    store.loadBySlug('a');
    requests['a'].next(article('a'));

    store.loadBySlug('b');
    expect(store.selectedArticle()).toBeNull();
    expect(store.loading()).toBe(true);
    expect(store.error()).toBeNull();

    requests['b'].next(article('b'));
    expect(store.selectedArticle()?.slug).toBe('b');
  });

  it('ignores a late response for a superseded slug (switchMap)', () => {
    store.loadBySlug('a');
    store.loadBySlug('b');
    requests['a'].next(article('a'));
    expect(store.selectedArticle()).toBeNull();
    requests['b'].next(article('b'));
    expect(store.selectedArticle()?.slug).toBe('b');
  });

  it('skips the request when the resolver already set this article', () => {
    store.setSelected(article('a'));
    store.loadBySlug('a');
    expect(getBySlug).not.toHaveBeenCalled();
    expect(store.selectedArticle()?.slug).toBe('a');
    expect(store.loading()).toBe(false);
  });

  it('on error: selected null, error set, notFound for 404', () => {
    store.loadBySlug('a');
    requests['a'].next(article('a'));

    store.loadBySlug('missing');
    requests['missing'].error(new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: '/x' }));
    expect(store.selectedArticle()).toBeNull();
    expect(store.error()).toBeTruthy();
    expect(store.notFound()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('on a non-404 error: notFound stays false', () => {
    store.loadBySlug('a');
    requests['a'].error(new HttpErrorResponse({ status: 500, statusText: 'Server Error', url: '/x' }));
    expect(store.selectedArticle()).toBeNull();
    expect(store.error()).toBeTruthy();
    expect(store.notFound()).toBe(false);
  });

  it('an empty body is treated as not found', () => {
    store.loadBySlug('a');
    requests['a'].next(null as unknown as Article);
    expect(store.selectedArticle()).toBeNull();
    expect(store.notFound()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('setSelectedError records a failed resolver load', () => {
    store.setSelected(article('a'));
    store.setSelectedError(new HttpErrorResponse({ status: 404 }));
    expect(store.selectedArticle()).toBeNull();
    expect(store.notFound()).toBe(true);
    expect(store.error()).toBeTruthy();
  });
});
