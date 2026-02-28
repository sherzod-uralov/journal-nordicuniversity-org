import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { NewsApiService } from '@services/api/news-api.service';
import { News } from '@core/models/news.model';

interface NewsState {
  newsList: News[];
  selectedNews: News | null;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  newsList: [],
  selectedNews: null,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

export const NewsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, newsApi = inject(NewsApiService)) => ({
    loadNews: rxMethod<{ page?: number; limit?: number }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          newsApi.getAll(params).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                newsList: res.data,
                totalPages: res.totalPages,
                currentPage: res.currentPage,
                loading: false,
              }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    loadBySlug: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, selectedNews: null })),
        switchMap((slug) =>
          newsApi.getBySlug(slug).pipe(
            tapResponse({
              next: (news) => patchState(store, { selectedNews: news, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedNews: null });
    },
  })),
);
