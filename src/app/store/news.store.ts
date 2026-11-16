import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { NewsApiService } from '@services/api/news-api.service';
import { errorMessage, isNotFoundError } from '@services/api/api-error.util';
import { LanguageService } from '@core/services/language.service';
import { NewsItem } from '@core/models/news.model';

interface NewsState {
  newsList: NewsItem[];
  /** Language newsList was requested in. */
  listLang: string | null;
  selectedNews: NewsItem | null;
  /** Language selectedNews was loaded in (news content and slugs are per language). */
  selectedLang: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  /** The last requested news item doesn't exist (API 404 / empty body). */
  notFound: boolean;
}

const initialState: NewsState = {
  newsList: [],
  listLang: null,
  selectedNews: null,
  selectedLang: null,
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
  notFound: false,
};

export const NewsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, newsApi = inject(NewsApiService), language = inject(LanguageService)) => {
    const isSelected = (slug: string): boolean =>
      store.selectedNews()?.slug === slug && store.selectedLang() === language.lang();

    return {
      loadNews: rxMethod<{ page?: number; limit?: number }>(
        pipe(
          tap(() => {
            const lang = language.lang();
            // A list in another language is stale — don't keep showing it while loading
            if (!store.newsList().length || store.listLang() !== lang) {
              patchState(store, { loading: true });
            }
            patchState(store, { listLang: lang, error: null });
          }),
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
                error: (err: unknown) => patchState(store, { error: errorMessage(err), loading: false }),
              })
            )
          ),
        )
      ),
      loadBySlug: rxMethod<string>(
        pipe(
          tap((slug) => {
            // Never show the previous item (or another language's copy) under a new URL
            if (!isSelected(slug)) {
              patchState(store, { selectedNews: null, selectedLang: null, loading: true, error: null, notFound: false });
            }
          }),
          switchMap((slug) => {
            // Skip HTTP request if resolver already pre-loaded this news item
            if (isSelected(slug)) return EMPTY;
            const lang = language.lang();
            return newsApi.getBySlug(slug).pipe(
              tapResponse({
                next: (news) => patchState(store, {
                  selectedNews: news ?? null,
                  selectedLang: news ? lang : null,
                  notFound: !news,
                  loading: false,
                }),
                error: (err: unknown) => patchState(store, {
                  selectedNews: null,
                  selectedLang: null,
                  error: errorMessage(err),
                  notFound: isNotFoundError(err),
                  loading: false,
                }),
              })
            );
          }),
        )
      ),
      /** True when `slug` is the selected item in the current language. */
      isSelected(slug: string): boolean {
        return isSelected(slug);
      },
      setSelected(news: NewsItem, lang: string = language.lang()): void {
        patchState(store, { selectedNews: news, selectedLang: lang, loading: false, error: null, notFound: false });
      },
      /** Records a failed news load (used by the resolver so the page doesn't refetch). */
      setSelectedError(err: unknown): void {
        patchState(store, {
          selectedNews: null,
          selectedLang: null,
          error: errorMessage(err),
          notFound: isNotFoundError(err),
          loading: false,
        });
      },
      clearSelected(): void {
        patchState(store, { selectedNews: null, selectedLang: null, notFound: false });
      },
    };
  }),
);
