import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { AuthorApiService } from '@services/api/author-api.service';
import { errorMessage, isNotFoundError } from '@services/api/api-error.util';
import { Author } from '@core/models/author.model';

interface AuthorState {
  authors: Author[];
  selectedAuthor: Author | null;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  /** The last requested author doesn't exist (API 404 / empty body). */
  notFound: boolean;
}

const initialState: AuthorState = {
  authors: [],
  selectedAuthor: null,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
  notFound: false,
};

export const AuthorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authorApi = inject(AuthorApiService)) => ({
    loadAuthors: rxMethod<{ page?: number; limit?: number }>(
      pipe(
        tap(() => { if (!store.authors().length) patchState(store, { loading: true }); }),
        switchMap((params) =>
          authorApi.getAll(params).pipe(
            tapResponse({
              next: (res) => patchState(store, {
                authors: res.data,
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
    loadById: rxMethod<string>(
      pipe(
        tap((id) => {
          // Never show the previous author under a new URL
          if (store.selectedAuthor()?.id !== id) {
            patchState(store, { selectedAuthor: null, loading: true, error: null, notFound: false });
          }
        }),
        switchMap((id) =>
          authorApi.getById(id).pipe(
            tapResponse({
              next: (author) => patchState(store, { selectedAuthor: author ?? null, notFound: !author, loading: false }),
              error: (err: unknown) => patchState(store, {
                selectedAuthor: null,
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
      patchState(store, { selectedAuthor: null, notFound: false });
    },
  })),
);
