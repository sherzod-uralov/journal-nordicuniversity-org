import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withTransferState } from '@core/utils/transfer-state.util';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { AboutApiService } from '@services/api/about-api.service';
import { AboutAll } from '@core/models/about.model';

interface AboutState {
  data: AboutAll | null;
  loading: boolean;
  error: string | null;
}

const initialState: AboutState = {
  data: null,
  loading: false,
  error: null,
};

export const AboutStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, aboutApi = inject(AboutApiService)) => ({
    loadAbout: rxMethod<void>(
      pipe(
        tap(() => { if (!store.data()) patchState(store, { loading: true }); }),
        switchMap(() =>
          aboutApi.getAll().pipe(
            tapResponse({
              next: (data) => patchState(store, { data, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
  })),
  withTransferState('about-store'),
);
