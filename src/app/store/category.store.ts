import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { CategoryApiService } from '@services/api/category-api.service';
import { errorMessage, isNotFoundError } from '@services/api/api-error.util';
import { Category } from '@core/models/category.model';

interface CategoryState {
  categories: Category[];
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;
  /** The last requested category doesn't exist (API 404 / empty body). */
  notFound: boolean;
}

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,
  notFound: false,
};

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, categoryApi = inject(CategoryApiService)) => ({
    loadCategories: rxMethod<void>(
      pipe(
        tap(() => { if (store.categories().length === 0) patchState(store, { loading: true }); }),
        switchMap(() =>
          categoryApi.getAll().pipe(
            tapResponse({
              next: (categories) => patchState(store, { categories, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    loadById: rxMethod<number>(
      pipe(
        tap((id) => {
          // Never show the previous category under a new URL
          if (store.selectedCategory()?.id !== id) {
            patchState(store, { selectedCategory: null, loading: true, error: null, notFound: false });
          }
        }),
        switchMap((id) =>
          categoryApi.getById(id).pipe(
            tapResponse({
              next: (category) => patchState(store, { selectedCategory: category ?? null, notFound: !category, loading: false }),
              error: (err: unknown) => patchState(store, {
                selectedCategory: null,
                error: errorMessage(err),
                notFound: isNotFoundError(err),
                loading: false,
              }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedCategory: null, notFound: false });
    },
  })),
);
