import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { AuthorApiService } from '@services/api/author-api.service';
import { Author } from '@core/models/author.model';

interface AuthorState {
  authors: Author[];
  selectedAuthor: Author | null;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

const initialState: AuthorState = {
  authors: [],
  selectedAuthor: null,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

export const AuthorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authorApi = inject(AuthorApiService)) => ({
    loadAuthors: rxMethod<{ page?: number; limit?: number }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
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
        tap(() => patchState(store, { loading: true, selectedAuthor: null })),
        switchMap((id) =>
          authorApi.getById(id).pipe(
            tapResponse({
              next: (author) => patchState(store, { selectedAuthor: author, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedAuthor: null });
    },
  })),
);
