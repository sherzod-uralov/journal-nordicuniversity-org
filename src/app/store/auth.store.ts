import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthorApiService, UpdateAuthorPayload } from '@services/api/author-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Author } from '@core/models/author.model';
import { Router } from '@angular/router';
import { CabinetStore } from './cabinet.store';

/**
 * Profile update body. `null` clears an optional field — `undefined` would be
 * dropped by JSON.stringify and the old value could never be removed.
 */
export type ProfileUpdatePayload = UpdateAuthorPayload;

interface AuthState {
  profile: Author | null;
  loading: boolean;
  /** True while a profile update request is in flight. */
  saving: boolean;
  /** True when the last profile load failed (drives the error + retry state). */
  profileLoadFailed: boolean;
  error: string | null;
}

const initialState: AuthState = {
  profile: null,
  loading: false,
  saving: false,
  profileLoadFailed: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((
    store,
    authorApi = inject(AuthorApiService),
    authService = inject(AuthService),
    cabinetStore = inject(CabinetStore),
    toast = inject(ToastService),
    router = inject(Router),
  ) => ({
    login: rxMethod<{ phone_number: string; password: string }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ phone_number, password }) =>
          authorApi.login(phone_number, password).pipe(
            tapResponse({
              next: (res) => {
                // A different user may have been signed in before — never show their data.
                cabinetStore.reset();
                authService.setToken(res.login_data.token);
                patchState(store, { profile: res.login_data.ExistAuthor, loading: false, profileLoadFailed: false });
                router.navigate(['/cabinet/dashboard']);
              },
              error: (err: HttpErrorResponse) => {
                const key = (err.status === 422 || err.status === 401)
                  ? 'auth.login.invalid_credentials'
                  : 'auth.login.error';
                toast.error(key);
                patchState(store, { loading: false });
              },
            })
          )
        ),
      )
    ),
    loadProfile: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, profileLoadFailed: false })),
        switchMap(() =>
          authorApi.getProfile().pipe(
            tapResponse({
              next: (profile) => patchState(store, { profile, loading: false }),
              error: (err: HttpErrorResponse) => {
                if (err.status !== 401) {
                  toast.error('auth.profile.error');
                }
                patchState(store, { loading: false, profileLoadFailed: true });
              },
            })
          )
        ),
      )
    ),
    /** Resolves to true on success so callers can leave edit mode only then. */
    updateProfile(data: ProfileUpdatePayload): Promise<boolean> {
      patchState(store, { saving: true, error: null });
      return new Promise<boolean>((resolve) => {
        authorApi.updateProfile(data).subscribe({
          next: (updated) => {
            const current = store.profile();
            patchState(store, { profile: current ? { ...current, ...updated } : updated, saving: false });
            toast.success('cabinet.profile.updated');
            resolve(true);
          },
          error: (err: HttpErrorResponse) => {
            const msg = (err.error && typeof err.error === 'object' && 'message' in err.error)
              ? String((err.error as { message?: string }).message ?? '')
              : '';
            toast.error(msg || 'cabinet.profile.update_error');
            patchState(store, { saving: false });
            resolve(false);
          },
        });
      });
    },
    /**
     * Single logout entry point: token, profile and all cabinet data are cleared.
     * `redirectTo` lets callers (e.g. the 401 interceptor) pick the target so there's one navigation.
     */
    logout(redirectTo = '/'): void {
      authService.logout();
      cabinetStore.reset();
      patchState(store, initialState);
      router.navigate([redirectTo]);
    },
    clearError(): void {
      patchState(store, { error: null });
    },
  })),
);
