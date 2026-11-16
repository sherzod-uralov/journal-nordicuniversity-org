import { ApplicationRef, Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, map, of, tap } from 'rxjs';

/**
 * SSR → browser hand-off for responses much bigger than what the UI renders.
 *
 * Callers make the request with `transferCache: false`, so Angular's HTTP transfer cache
 * doesn't embed the full body in the HTML. The response is mapped through `slim`; the server
 * stores that slim copy under an explicit TransferState key, and the browser reads it (once,
 * only while hydrating) instead of repeating the request.
 */
@Injectable({ providedIn: 'root' })
export class SlimTransferService {
  private readonly transferState = inject(TransferState);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private hydrating = !this.isServer;

  constructor() {
    if (this.hydrating) {
      // Like the HTTP transfer cache: serve transferred data only for the initial render.
      inject(ApplicationRef).whenStable().then(() => (this.hydrating = false));
    }
  }

  get<T>(key: string, request: () => Observable<T>, slim: (value: T) => T): Observable<T> {
    const stateKey = makeStateKey<T>(`slim:${key}`);

    if (this.hydrating && this.transferState.hasKey(stateKey)) {
      const value = this.transferState.get(stateKey, null as T);
      this.transferState.remove(stateKey);
      return of(value);
    }

    return request().pipe(
      map((value) => slim(value)),
      tap((value) => {
        if (this.isServer) this.transferState.set(stateKey, value);
      }),
    );
  }
}
