import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { AuthorApiService } from '@services/api/author-api.service';
import { Article } from '@core/models/article.model';

interface CabinetState {
  /** Author whose articles are currently held in `myArticles`. */
  authorId: string | null;
  myArticles: Article[];
  loading: boolean;
  error: string | null;
}

const initialState: CabinetState = {
  authorId: null,
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
  withMethods((store, authorApi = inject(AuthorApiService)) => ({
    loadMyArticles: rxMethod<string>(
      pipe(
        tap((authorId) => {
          if (store.authorId() !== authorId) {
            // Different (or first) user: drop the previous user's list and show the skeleton.
            patchState(store, { authorId, myArticles: [], loading: true, error: null });
          } else {
            // Same user: keep the list visible while refreshing in the background.
            patchState(store, { loading: !store.myArticles().length, error: null });
          }
        }),
        switchMap((authorId) =>
          authorApi.getMyArticles(authorId).pipe(
            tapResponse({
              next: (articles) => patchState(store, { myArticles: articles, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message || 'common.error', loading: false }),
            })
          )
        ),
      )
    ),
    /** Clears all private data — called on logout. */
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
