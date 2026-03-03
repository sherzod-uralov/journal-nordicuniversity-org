import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withTransferState } from '@core/utils/transfer-state.util';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { NewsApiService } from '@services/api/news-api.service';
import { NewsItem } from '@core/models/news.model';

interface NewsState {
  newsList: NewsItem[];
  selectedNews: NewsItem | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  newsList: [],
  selectedNews: null,
  totalCount: 0,
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
        tap(() => { if (!store.newsList().length) patchState(store, { loading: true }); }),
        switchMap((params) =>
          newsApi.getList(params).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                newsList: res.data,
                totalCount: res.TotalCount,
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
        tap(() => { if (!store.selectedNews()) patchState(store, { loading: true }); }),
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
  withTransferState('news-store'),
);
