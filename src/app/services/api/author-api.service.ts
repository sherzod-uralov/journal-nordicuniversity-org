import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { Author, AuthorLoginResponse } from '@core/models/author.model';
import { Article } from '@core/models/article.model';
import { PaginatedResponse } from '@core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/author`;

  getAll(params?: { page?: number; limit?: number }): Observable<PaginatedResponse<Author>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedResponse<Author>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Author> {
    return this.http.get<Author>(`${this.baseUrl}/${id}`);
  }

  login(phone_number: string, password: string): Observable<AuthorLoginResponse> {
    return this.http.post<AuthorLoginResponse>(`${this.baseUrl}/login`, { phone_number, password });
  }

  register(data: { phone_number: string; full_name: string; password: string; science_degree: string; job: string; birthday: string; place_position: string; OrcID?: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/create`, data);
  }

  getProfile(): Observable<Author> {
    return this.http.get<{ data: Author }>(`${this.baseUrl}/profile`).pipe(
      map(res => res.data)
    );
  }

  getMyArticles(authorId: string): Observable<Article[]> {
    return this.http.post<{ data: Article[] }>(`${this.baseUrl}/article_author`, { id: authorId }).pipe(
      map(res => res.data)
    );
  }
}
