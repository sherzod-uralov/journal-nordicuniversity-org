import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { NewsItem, NewsListResponse } from '@core/models/news.model';
import { LanguageService } from '@core/services/language.service';

@Injectable({ providedIn: 'root' })
export class NewsApiService {
  private readonly http = inject(HttpClient);
  private readonly langService = inject(LanguageService);
  private readonly baseUrl = `${environment.apiUrl}/news`;

  getList(params?: { page?: number; limit?: number }): Observable<NewsListResponse> {
    let httpParams = new HttpParams().set('lang', this.langService.lang());
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.post<NewsListResponse>(`${this.baseUrl}/list`, {}, { params: httpParams });
  }

  getBySlug(slug: string): Observable<NewsItem> {
    const params = new HttpParams()
      .set('slug', slug)
      .set('lang', this.langService.lang());
    return this.http.get<NewsItem>(this.baseUrl, { params });
  }
}
