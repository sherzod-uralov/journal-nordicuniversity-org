import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';

/** Longest an HTTP call may take during SSR before the render stops waiting for it. */
export const SSR_HTTP_TIMEOUT_MS = 8000;

/**
 * Server only: a hung API must not stall the (single) SSR process.
 * Timeouts surface as a 504 HttpErrorResponse so existing error handlers render their fallback.
 */
export const serverTimeoutInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) {
    return next(req);
  }

  return next(req).pipe(
    timeout(SSR_HTTP_TIMEOUT_MS),
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof TimeoutError
          ? new HttpErrorResponse({ status: 504, statusText: 'Gateway Timeout', url: req.urlWithParams, error })
          : error,
      ),
    ),
  );
};
