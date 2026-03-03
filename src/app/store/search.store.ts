import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime, distinctUntilChanged, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SearchService } from '@core/services/search.service';
import { SearchSuggestion, SearchHistoryEntry } from '@core/models/search.model';

interface SearchState {
  query: string;
  suggestions: SearchSuggestion[];
  searchHistory: SearchHistoryEntry[];
  trendingSearches: SearchSuggestion[];
  isOverlayOpen: boolean;
  activeSuggestionIndex: number;
  suggestionsLoading: boolean;
}

const initialState: SearchState = {
  query: '',
  suggestions: [],
  searchHistory: [],
  trendingSearches: [],
  isOverlayOpen: false,
  activeSuggestionIndex: -1,
  suggestionsLoading: false,
};

export const SearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, searchService = inject(SearchService), router = inject(Router)) => ({
    openOverlay(): void {
      patchState(store, {
        isOverlayOpen: true,
        query: '',
        suggestions: [],
        activeSuggestionIndex: -1,
        searchHistory: searchService.getHistory(),
      });
      this.loadTrending();
    },
    closeOverlay(): void {
      patchState(store, {
        isOverlayOpen: false,
        query: '',
        suggestions: [],
        activeSuggestionIndex: -1,
      });
    },
    setQuery(query: string): void {
      patchState(store, { query, activeSuggestionIndex: -1 });
    },
    loadSuggestions: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((q) => {
          if (q.trim()) {
            patchState(store, { suggestionsLoading: true });
          } else {
            patchState(store, { suggestions: [], suggestionsLoading: false });
          }
        }),
        switchMap((q) => {
          if (!q.trim()) return of([]);
          return searchService.getSuggestions(q).pipe(
            tapResponse({
              next: (suggestions) => patchState(store, { suggestions, suggestionsLoading: false }),
              error: () => patchState(store, { suggestions: [], suggestionsLoading: false }),
            })
          );
        }),
      )
    ),
    loadTrending(): void {
      searchService.getTrendingSearches().subscribe({
        next: (trending) => patchState(store, { trendingSearches: trending }),
        error: () => patchState(store, { trendingSearches: [] }),
      });
    },
    navigateSuggestion(direction: 'up' | 'down'): void {
      const suggestions = store.suggestions();
      const history = store.searchHistory();
      const trending = store.trendingSearches();
      const query = store.query();

      const items = query.trim() ? suggestions : [...history.map(h => h.query), ...trending.map(t => t.label)];
      const total = query.trim() ? suggestions.length : (history.length + trending.length);
      if (total === 0) return;

      const current = store.activeSuggestionIndex();
      let next: number;
      if (direction === 'down') {
        next = current < total - 1 ? current + 1 : 0;
      } else {
        next = current > 0 ? current - 1 : total - 1;
      }
      patchState(store, { activeSuggestionIndex: next });
    },
    selectSuggestion(suggestion: SearchSuggestion): void {
      if (suggestion.route) {
        searchService.addToHistory(suggestion.label);
        patchState(store, { isOverlayOpen: false, query: '' });
        router.navigateByUrl(suggestion.route);
      } else if (suggestion.type === 'history') {
        patchState(store, { isOverlayOpen: false, query: '' });
        router.navigate(['/articles'], { queryParams: { q: suggestion.label } });
      }
    },
    executeSearch(query: string): void {
      if (!query.trim()) return;
      searchService.addToHistory(query.trim());
      patchState(store, { isOverlayOpen: false, query: '' });
      router.navigate(['/articles'], { queryParams: { q: query.trim() } });
    },
    refreshHistory(): void {
      patchState(store, { searchHistory: searchService.getHistory() });
    },
    removeHistoryItem(query: string): void {
      searchService.removeFromHistory(query);
      patchState(store, { searchHistory: searchService.getHistory() });
    },
    clearHistory(): void {
      searchService.clearHistory();
      patchState(store, { searchHistory: [] });
    },
  })),
);
