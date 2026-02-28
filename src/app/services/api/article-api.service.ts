import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Article, ArticleFilterBody, MultiArticlesResponse } from '@core/models/article.model';
import { PaginatedResponse, MultiSearchResponse } from '@core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ArticleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/article`;

  getAll(params?: { page?: number; limit?: number; order?: 'ASC' | 'DESC' }): Observable<PaginatedResponse<Article>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.order) httpParams = httpParams.set('order', params.order);
    return this.http.get<PaginatedResponse<Article>>(this.baseUrl, { params: httpParams });
  }

  getBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/user/slug/${slug}`);
  }

  getNecessary(articles = 6, topArticles = 2, lastArticles = 8): Observable<MultiArticlesResponse> {
    const params = new HttpParams()
      .set('articles', articles)
      .set('topArticles', topArticles)
      .set('lastArticles', lastArticles);
    return this.http.get<MultiArticlesResponse>(`${this.baseUrl}/necessary`, { params });
  }

  multiSearch(body: ArticleFilterBody, page = 1, limit = 12): Observable<MultiSearchResponse<Article>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.http.post<MultiSearchResponse<Article>>(`${this.baseUrl}/multi-search`, body, { params });
  }

  getByVolume(volumeId: number): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.baseUrl}/user/volume/${volumeId}`);
  }

  getByCategory(categoryId: number, params?: { page?: number; limit?: number }): Observable<PaginatedResponse<Article>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedResponse<Article>>(`${this.baseUrl}/category/${categoryId}`, { params: httpParams });
  }

  getByAuthor(authorId: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.baseUrl}/author/${authorId}`);
  }

  getUserArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/user/${id}`);
  }

  create(data: Record<string, unknown>): Observable<Article> {
    return this.http.post<Article>(`${this.baseUrl}/user/create`, data);
  }

  update(id: string, data: FormData): Observable<Article> {
    return this.http.put<Article>(`${this.baseUrl}/author/${id}`, data);
  }
}
