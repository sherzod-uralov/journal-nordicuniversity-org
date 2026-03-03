import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withTransferState } from '@core/utils/transfer-state.util';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { VolumeApiService } from '@services/api/volume-api.service';
import { Volume } from '@core/models/volume.model';

interface VolumeState {
  volumes: Volume[];
  selectedVolume: Volume | null;
  loading: boolean;
  error: string | null;
}

const initialState: VolumeState = {
  volumes: [],
  selectedVolume: null,
  loading: false,
  error: null,
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
        tap(() => { if (!store.selectedVolume()) patchState(store, { loading: true }); }),
        switchMap((id) =>
          volumeApi.getById(id).pipe(
            tapResponse({
              next: (volume) => patchState(store, { selectedVolume: volume, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    clearSelected(): void {
      patchState(store, { selectedVolume: null });
    },
  })),
  withTransferState('volume-store'),
);
