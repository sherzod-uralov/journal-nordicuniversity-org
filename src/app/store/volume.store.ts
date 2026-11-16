import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { VolumeApiService } from '@services/api/volume-api.service';
import { errorMessage, isNotFoundError } from '@services/api/api-error.util';
import { Volume } from '@core/models/volume.model';

interface VolumeState {
  volumes: Volume[];
  selectedVolume: Volume | null;
  loading: boolean;
  error: string | null;
  /** The last requested volume doesn't exist (API 404 / empty body). */
  notFound: boolean;
}

const initialState: VolumeState = {
  volumes: [],
  selectedVolume: null,
  loading: false,
  error: null,
  notFound: false,
};

export const VolumeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, volumeApi = inject(VolumeApiService)) => ({
    loadVolumes: rxMethod<void>(
      pipe(
        tap(() => { if (store.volumes().length === 0) patchState(store, { loading: true }); }),
        switchMap(() =>
          volumeApi.getAll().pipe(
            tapResponse({
              next: (volumes) => patchState(store, { volumes, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    loadById: rxMethod<number>(
      pipe(
        tap((id) => {
          // Never show the previous volume under a new URL
          if (store.selectedVolume()?.id !== id) {
            patchState(store, { selectedVolume: null, loading: true, error: null, notFound: false });
          }
        }),
        switchMap((id) =>
          volumeApi.getById(id).pipe(
            tapResponse({
              next: (volume) => patchState(store, { selectedVolume: volume ?? null, notFound: !volume, loading: false }),
              error: (err: unknown) => patchState(store, {
                selectedVolume: null,
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
      patchState(store, { selectedVolume: null, notFound: false });
    },
  })),
);
