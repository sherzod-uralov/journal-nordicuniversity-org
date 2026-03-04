import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthorApiService } from '@services/api/author-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Author } from '@core/models/author.model';
import { Router } from '@angular/router';

interface AuthState {
  profile: Author | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  profile: null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authorApi = inject(AuthorApiService), authService = inject(AuthService), toast = inject(ToastService), router = inject(Router)) => ({
    login: rxMethod<{ phone_number: string; password: string }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ phone_number, password }) =>
          authorApi.login(phone_number, password).pipe(
            tapResponse({
              next: (res) => {
                authService.setToken(res.login_data.token);
                patchState(store, { profile: res.login_data.ExistAuthor, loading: false });
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
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          authorApi.getProfile().pipe(
            tapResponse({
              next: (profile) => patchState(store, { profile, loading: false }),
              error: (err: Error) => patchState(store, { error: err.message, loading: false }),
            })
          )
        ),
      )
    ),
    logout(): void {
      authService.logout();
      patchState(store, { profile: null });
      router.navigate(['/']);
    },
    clearError(): void {
      patchState(store, { error: null });
    },
  })),
);
