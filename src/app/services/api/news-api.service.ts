import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { News } from '@core/models/news.model';
import { PaginatedResponse } from '@core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class NewsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/news`;

  getAll(params?: { page?: number; limit?: number }): Observable<PaginatedResponse<News>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedResponse<News>>(this.baseUrl, { params: httpParams });
  }

  getBySlug(slug: string): Observable<News> {
    return this.http.get<News>(`${this.baseUrl}/${slug}`);
  }
}
