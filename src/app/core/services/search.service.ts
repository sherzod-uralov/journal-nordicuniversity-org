import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, forkJoin, of, map } from 'rxjs';
import { SearchHistoryEntry, SearchSuggestion } from '@core/models/search.model';
import { ArticleApiService } from '@services/api/article-api.service';
import { CategoryStore } from '@store/category.store';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly articleApi = inject(ArticleApiService);
  private readonly categoryStore = inject(CategoryStore);

  getHistory(): SearchHistoryEntry[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  addToHistory(query: string, resultCount?: number): void {
    if (!this.isBrowser || !query.trim()) return;
    let history = this.getHistory();
    history = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
    history.unshift({ query: query.trim(), timestamp: Date.now(), resultCount });
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  removeFromHistory(query: string): void {
    if (!this.isBrowser) return;
    const history = this.getHistory().filter(h => h.query !== query);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  clearHistory(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(HISTORY_KEY);
  }

  getSuggestions(query: string): Observable<SearchSuggestion[]> {
    if (!query.trim()) return of([]);

    const q = query.toLowerCase();

    const articles$ = this.articleApi.searchSuggestions(query, 5).pipe(
      map(articles => articles.map(a => ({
        type: 'article' as const,
        id: a.id,
        label: a.title,
        subtitle: a.author?.full_name ?? '',
        route: `/articles/${a.slug}`,
      })))
    );

    const categories = this.categoryStore.categories()
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: 'category' as const,
        id: String(c.id),
        label: c.name,
        route: `/categories/${c.id}`,
      }));

    const history = this.getHistory()
      .filter(h => h.query.toLowerCase().includes(q))
      .slice(0, 3)
      .map(h => ({
        type: 'history' as const,
        id: h.query,
        label: h.query,
        subtitle: h.resultCount != null ? `${h.resultCount} results` : undefined,
      }));

    return forkJoin([articles$, of(categories), of(history)]).pipe(
      map(([articleSuggs, catSuggs, historySuggs]) => [
        ...historySuggs,
        ...articleSuggs,
        ...catSuggs,
      ])
    );
  }

  getTrendingSearches(): Observable<SearchSuggestion[]> {
    return this.articleApi.getTopArticles().pipe(
      map(articles => articles.slice(0, 5).map(a => ({
        type: 'trending' as const,
        id: a.id,
        label: a.title,
        subtitle: a.author?.full_name ?? '',
        route: `/articles/${a.slug}`,
      })))
    );
  }
}
