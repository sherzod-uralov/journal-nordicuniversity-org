import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { AuthStore } from '@store/auth.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  // AuthStore is resolved lazily: injecting it eagerly here would create a DI cycle
  // (LanguageService ctor → HTTP → this interceptor → AuthStore → ToastService → LanguageService).
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle auth redirects in the browser — SSR should just pass errors through
      if (isPlatformBrowser(platformId) && error.status === 401 && authService.isAuthenticated()) {
        // Clears token, profile and cabinet data so nothing private survives the session,
        // then performs the single navigation to the login page.
        injector.get(AuthStore).logout('/auth/login');
      }
      return throwError(() => error);
    })
  );
};
