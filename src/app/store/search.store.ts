import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, exhaustMap, tap, debounceTime, distinctUntilChanged, filter, map, of } from 'rxjs';
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
  withMethods((store, searchService = inject(SearchService), router = inject(Router)) => {
    // Each overlay open/close starts a new suggestion session: distinctUntilChanged must not
    // swallow a query typed in a previous session, and late results of one are dropped.
    let session = 0;

    const loadTrending = rxMethod<void>(
      pipe(
        // Cached for the app session; retried on the next open only if it failed / was empty
        filter(() => !store.trendingSearches().length),
        exhaustMap(() =>
          searchService.getTrendingSearches().pipe(
            tapResponse({
              next: (trending) => patchState(store, { trendingSearches: trending }),
              error: () => patchState(store, { trendingSearches: [] }),
            })
          )
        ),
      )
    );

    const resetSession = (isOverlayOpen: boolean): void => {
      session++;
      patchState(store, {
        isOverlayOpen,
        query: '',
        suggestions: [],
        suggestionsLoading: false,
        activeSuggestionIndex: -1,
      });
    };

    return {
      openOverlay(): void {
        resetSession(true);
        patchState(store, { searchHistory: searchService.getHistory() });
        loadTrending();
      },
      closeOverlay(): void {
        resetSession(false);
      },
      setQuery(query: string): void {
        patchState(store, { query, activeSuggestionIndex: -1 });
      },
      loadSuggestions: rxMethod<string>(
        pipe(
          map((q) => ({ q, session })),
          debounceTime(300),
          filter((input) => input.session === session),
          distinctUntilChanged((a, b) => a.q === b.q && a.session === b.session),
          tap(({ q }) => {
            if (q.trim()) {
              patchState(store, { suggestionsLoading: true });
            } else {
              patchState(store, { suggestions: [], suggestionsLoading: false });
            }
          }),
          switchMap(({ q, session: requestSession }) => {
            if (!q.trim()) return of([]);
            return searchService.getSuggestions(q).pipe(
              tapResponse({
                next: (suggestions) => {
                  if (requestSession === session) patchState(store, { suggestions, suggestionsLoading: false });
                },
                error: () => {
                  if (requestSession === session) patchState(store, { suggestions: [], suggestionsLoading: false });
                },
              })
            );
          }),
        )
      ),
      loadTrending,
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
          resetSession(false);
          router.navigateByUrl(suggestion.route);
        } else if (suggestion.type === 'history') {
          resetSession(false);
          router.navigate(['/articles'], { queryParams: { q: suggestion.label } });
        }
      },
      executeSearch(query: string): void {
        if (!query.trim()) return;
        searchService.addToHistory(query.trim());
        resetSession(false);
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
    };
  }),
);
