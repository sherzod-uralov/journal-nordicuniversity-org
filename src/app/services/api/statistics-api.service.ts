import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';

export interface StatisticsData {
  articles: {
    articlesCount: {
      articlesCount: number;
      acceptedArticlesCount: number;
      rejectedArticlesCount: number;
    };
    mostViewedArticles: unknown[];
  };
  volumes: { id: number; title: string; articlesCount: number }[];
  authors: {
    authorsCount: number;
    mostActiveAuthors: unknown[];
  };
  news: {
    newsCount: number;
  };
  viewsByDevice: {
    mobile: number;
    desktop: number;
    other: number;
  };
}

export interface StatisticsResponse {
  status: number;
  message: string;
  data: StatisticsData;
}

@Injectable({ providedIn: 'root' })
export class StatisticsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/statistics`;

  getStatistics(): Observable<StatisticsResponse> {
    return this.http.get<StatisticsResponse>(this.baseUrl);
  }
}
