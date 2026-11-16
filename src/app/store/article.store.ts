import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ArticleApiService } from '@services/api/article-api.service';
import { errorMessage, isNotFoundError } from '@services/api/api-error.util';
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
  /** The last requested article doesn't exist (API 404 / empty body). */
  notFound: boolean;
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
  notFound: false,
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
        tap((slug) => {
          // Never show the previous article under a new URL
          if (store.selectedArticle()?.slug !== slug) {
            patchState(store, { selectedArticle: null, loading: true, error: null, notFound: false });
          }
        }),
        switchMap((slug) =>
          // Skip HTTP request if resolver already pre-loaded this article
          store.selectedArticle()?.slug === slug
            ? EMPTY
            : articleApi.getBySlug(slug).pipe(
                tapResponse({
                  next: (article) => patchState(store, { selectedArticle: article ?? null, notFound: !article, loading: false }),
                  error: (err: unknown) => patchState(store, {
                    selectedArticle: null,
                    error: errorMessage(err),
                    notFound: isNotFoundError(err),
                    loading: false,
                  }),
                })
              )
        ),
      )
    ),
    setSelected(article: Article): void {
      patchState(store, { selectedArticle: article, loading: false, error: null, notFound: false });
    },
    /** Records a failed article load (used by the resolver so the page doesn't refetch). */
    setSelectedError(err: unknown): void {
      patchState(store, {
        selectedArticle: null,
        error: errorMessage(err),
        notFound: isNotFoundError(err),
        loading: false,
      });
    },
    searchArticles: rxMethod<{ body: ArticleFilterBody; page?: number; limit?: number }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
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
              error: (err: unknown) => patchState(store, {
                articles: [],
                totalPages: 0,
                totalItems: 0,
                error: errorMessage(err),
                loading: false,
              }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedArticle: null, notFound: false });
    },
  })),
);
