import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withTransferState } from '@core/utils/transfer-state.util';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article, ArticleFilterBody, MultiArticlesResponse } from '@core/models/article.model';

interface ArticleState {
  articles: Article[];
  selectedArticle: Article | null;
  multiData: MultiArticlesResponse | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
}

const initialState: ArticleState = {
  articles: [],
  selectedArticle: null,
  multiData: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  loading: false,
  error: null,
};

export const ArticleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ articles, multiData }) => ({
    featuredArticles: computed(() => multiData()?.topArticles ?? []),
    latestArticles: computed(() => multiData()?.lastArticles ?? []),
    homeArticles: computed(() => multiData()?.articles ?? []),
    articleCount: computed(() => articles().length),
  })),
  withMethods((store, articleApi = inject(ArticleApiService)) => ({
    loadArticles: rxMethod<{ page?: number; limit?: number; order?: 'ASC' | 'DESC' }>(
      pipe(
        tap(() => {
          if (!store.articles().length) patchState(store, { loading: true });
          patchState(store, { error: null });
        }),
        switchMap((params) =>
          articleApi.getAll(params).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                articles: res.data,
                totalPages: res.totalPages,
                currentPage: res.currentPage,
                totalItems: res.count,
                loading: false,
              }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    loadMulti: rxMethod<void>(
      pipe(
        tap(() => { if (!store.multiData()) patchState(store, { loading: true }); }),
        switchMap(() =>
          articleApi.getNecessary().pipe(
            tapResponse({
              next: (data) => patchState(store, { multiData: data, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    loadBySlug: rxMethod<string>(
      pipe(
        tap(() => { if (!store.selectedArticle()) patchState(store, { loading: true }); }),
        switchMap((slug) =>
          articleApi.getBySlug(slug).pipe(
            tapResponse({
              next: (article) => patchState(store, { selectedArticle: article, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    searchArticles: rxMethod<{ body: ArticleFilterBody; page?: number; limit?: number }>(
      pipe(
        tap(() => {
          if (!store.articles().length) patchState(store, { loading: true });
          patchState(store, { error: null });
        }),
        switchMap(({ body, page, limit }) =>
          articleApi.multiSearch(body, page ?? 1, limit ?? 12).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                articles: res.data,
                totalPages: res.totalPages,
                currentPage: res.currentPage,
                totalItems: res.filterItems,
                loading: false,
              }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedArticle: null });
    },
  })),
  withTransferState('article-store'),
);
