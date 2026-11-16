import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { Article, ArticleFilterBody, MultiArticlesResponse } from '@core/models/article.model';
import { AuthorShort } from '@core/models/author.model';
import { PaginatedResponse, MultiSearchResponse } from '@core/models/api-response.model';
import { SlimTransferService } from './slim-transfer.service';

/**
 * The public article endpoints embed full author rows. Drop the private ones (phone,
 * birthday, password hash, email) so they never reach the store or the SSR HTML.
 */
function toPublicAuthor<T extends AuthorShort | null | undefined>(author: T): T {
  if (!author) return author;
  const { phone_number, birthday, password, email, ...rest } =
    author as AuthorShort & { password?: unknown; email?: unknown };
  return rest as T;
}

/** Full article for the public detail page: author personal data and payment links removed. */
export function toPublicArticle(article: Article): Article {
  if (!article) return article;
  const { transaction, ...rest } = article;
  return {
    ...rest,
    author: toPublicAuthor(article.author),
    coAuthors: Array.isArray(article.coAuthors) ? article.coAuthors.map(toPublicAuthor) : article.coAuthors,
    certificates: Array.isArray(article.certificates)
      ? article.certificates.map((c) => c && { ...c, author: toPublicAuthor(c.author) })
      : article.certificates,
  } as Article;
}

/**
 * Card-sized copy of an article for lists: drops the heavy fields only the detail page
 * (which fetches the full article by slug) renders.
 */
export function toArticleSummary(article: Article): Article {
  if (!article) return article;
  const {
    references, description, certificates, transaction,
    plagiarist_file, review_file, file, volume, ...summary
  } = article;
  return {
    ...summary,
    author: toPublicAuthor(summary.author),
    coAuthors: Array.isArray(summary.coAuthors) ? summary.coAuthors.map(toPublicAuthor) : summary.coAuthors,
    volume: volume ? { id: volume.id, title: volume.title } : volume,
  } as Article;
}

function toArticleSummaries(articles: Article[]): Article[] {
  return Array.isArray(articles) ? articles.map(toArticleSummary) : articles;
}

@Injectable({ providedIn: 'root' })
export class ArticleApiService {
  private readonly http = inject(HttpClient);
  private readonly slimTransfer = inject(SlimTransferService);
  private readonly baseUrl = `${environment.apiUrl}/article`;

  getAll(params?: { page?: number; limit?: number; order?: 'ASC' | 'DESC' }): Observable<PaginatedResponse<Article>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.order) httpParams = httpParams.set('order', params.order);
    return this.http.get<PaginatedResponse<Article>>(this.baseUrl, { params: httpParams });
  }

  getBySlug(slug: string): Observable<Article> {
    // Not transfer-cached raw: the API body carries authors' personal data (see toPublicArticle).
    return this.slimTransfer.get(
      `article-slug:${slug}`,
      () => this.http.get<Article>(`${this.baseUrl}/user/slug/${encodeURIComponent(slug)}`, { transferCache: false }),
      toPublicArticle,
    );
  }

  // `articles` covers the home grid (6) plus the up-to-3 the featured sidebar takes from it
  getNecessary(articles = 9, topArticles = 2, lastArticles = 8): Observable<MultiArticlesResponse> {
    const params = new HttpParams()
      .set('articles', articles)
      .set('topArticles', topArticles)
      .set('lastArticles', lastArticles);
    return this.slimTransfer.get(
      `article-necessary:${articles}:${topArticles}:${lastArticles}`,
      () => this.http.get<MultiArticlesResponse>(`${this.baseUrl}/necessary`, { params, transferCache: false }),
      (res) => res && {
        articles: toArticleSummaries(res.articles),
        topArticles: toArticleSummaries(res.topArticles),
        lastArticles: toArticleSummaries(res.lastArticles),
      },
    );
  }

  multiSearch(body: ArticleFilterBody, page = 1, limit = 12): Observable<MultiSearchResponse<Article>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.slimTransfer.get(
      `article-search:${page}:${limit}:${JSON.stringify(body)}`,
      () => this.http.post<MultiSearchResponse<Article>>(`${this.baseUrl}/multi-search`, body, { params, transferCache: false }),
      (res) => res && { ...res, data: toArticleSummaries(res.data) },
    );
  }

  getByVolume(volumeId: number): Observable<Article[]> {
    return this.slimTransfer.get(
      `article-volume:${volumeId}`,
      () => this.http.get<Article[]>(`${this.baseUrl}/user/volume/${encodeURIComponent(volumeId)}`, { transferCache: false }),
      toArticleSummaries,
    );
  }

  getByCategory(categoryId: number): Observable<Article[]> {
    return this.slimTransfer.get(
      `article-category:${categoryId}`,
      () => this.http.get<Article[]>(`${this.baseUrl}/user/category/${encodeURIComponent(categoryId)}`, { transferCache: false }),
      toArticleSummaries,
    );
  }

  /** Public (user side) list of an author's articles. */
  getByAuthor(authorId: string): Observable<Article[]> {
    return this.slimTransfer.get(
      `article-author:${authorId}`,
      () => this.http.post<{ data: Article[] }>(`${environment.apiUrl}/author/article_author_user`, { id: authorId }, { transferCache: false })
        .pipe(map(res => res?.data ?? [])),
      toArticleSummaries,
    );
  }

  getUserArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/user/${encodeURIComponent(id)}`);
  }

  create(data: Record<string, unknown>): Observable<Article> {
    return this.http.post<Article>(`${this.baseUrl}/user/create`, data);
  }

  update(id: string, data: FormData): Observable<Article> {
    return this.http.put<Article>(`${this.baseUrl}/author/${encodeURIComponent(id)}`, data);
  }

  searchSuggestions(query: string, limit = 5): Observable<Article[]> {
    const body: ArticleFilterBody = {
      mainFilter: { title: query },
      sort: { createdAt: 'DESC' },
    };
    const params = new HttpParams().set('page', 1).set('limit', limit);
    return this.http.post<MultiSearchResponse<Article>>(`${this.baseUrl}/multi-search`, body, { params }).pipe(
      map(res => res.data)
    );
  }

  getTopArticles(limit = 5): Observable<Article[]> {
    const body: ArticleFilterBody = {
      mainFilter: {}, // required by the API (409 without it)
      sort: { viewsCount: 'DESC', createdAt: 'DESC' },
    };
    const params = new HttpParams().set('page', 1).set('limit', limit);
    return this.http.post<MultiSearchResponse<Article>>(`${this.baseUrl}/multi-search`, body, { params }).pipe(
      map(res => res.data)
    );
  }
}
