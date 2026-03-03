import { effect, inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { getState, patchState, signalStoreFeature, withHooks } from '@ngrx/signals';

/**
 * Signal Store feature that transfers server-side state to the client
 * during SSR hydration, preventing the "flash of empty content".
 *
 * On the server: captures the final store state into Angular TransferState.
 * On the client: restores state from TransferState before components render.
 */
export function withTransferState(storeKey: string) {
  return signalStoreFeature(
    withHooks({
      onInit(store: any) {
        const transferState = inject(TransferState);
        const platformId = inject(PLATFORM_ID);
        const key = makeStateKey<Record<string, unknown>>(storeKey);

        if (isPlatformBrowser(platformId)) {
          const serverState = transferState.get(key, null!);
          if (serverState) {
            patchState(store, serverState);
            transferState.remove(key);
          }
        }

        if (isPlatformServer(platformId)) {
          effect(() => {
            const state = getState(store);
            transferState.set(key, { ...state } as any);
          });
        }
      },
    }),
  );
}
