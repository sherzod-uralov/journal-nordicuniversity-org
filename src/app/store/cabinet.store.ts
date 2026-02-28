import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { AuthorApiService } from '@services/api/author-api.service';
import { AuthService } from '@core/services/auth.service';
import { Article } from '@core/models/article.model';

interface CabinetState {
  myArticles: Article[];
  loading: boolean;
  error: string | null;
}

const initialState: CabinetState = {
  myArticles: [],
  loading: false,
  error: null,
};

export const CabinetStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ myArticles }) => ({
    totalArticles: computed(() => myArticles().length),
    acceptedArticles: computed(() => myArticles().filter(a => a.status === 'ACCEPT').length),
    reviewArticles: computed(() => myArticles().filter(a => ['NEW', 'PLAGIARISM', 'REVIEW', 'PAYMENT'].includes(a.status)).length),
    rejectedArticles: computed(() => myArticles().filter(a => a.status === 'REJECTED').length),
  })),
  withMethods((store, authorApi = inject(AuthorApiService), authService = inject(AuthService)) => ({
    loadMyArticles: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((authorId) =>
          authorApi.getMyArticles(authorId).pipe(
            tapResponse({
              next: (articles) => patchState(store, { myArticles: articles, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
  })),
);
