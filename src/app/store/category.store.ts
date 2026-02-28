import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { CategoryApiService } from '@services/api/category-api.service';
import { Category } from '@core/models/category.model';

interface CategoryState {
  categories: Category[];
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, categoryApi = inject(CategoryApiService)) => ({
    loadCategories: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
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
        tap(() => patchState(store, { loading: true, selectedCategory: null })),
        switchMap((id) =>
          categoryApi.getById(id).pipe(
            tapResponse({
              next: (category) => patchState(store, { selectedCategory: category, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedCategory: null });
    },
  })),
);
