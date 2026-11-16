import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withNavigationErrorHandler } from '@angular/router';
import { HttpRequest, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withIncrementalHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { serverTimeoutInterceptor } from '@core/interceptors/server-timeout.interceptor';
import { reloadOnChunkLoadError } from '@core/utils/chunk-reload.util';
import { JournalPreset } from '@core/theme/journal-preset';

/** Per-user API endpoints: never serialized into SSR HTML nor replayed from the transfer cache. */
const PRIVATE_API_PATHS: RegExp[] = [
  /\/author\/(profile|login|create|article_author)\b/, // own profile, login, register, my articles
  /\/billing\b/, // transactions
  /\/file\/uploadFile\b/, // uploads
  /\/article\/user\/(?!slug\/|volume\/|category\/)/, // own article by id, create article
];

const isTransferCacheable = (req: HttpRequest<unknown>): boolean =>
  !PRIVATE_API_PATHS.some((pattern) => pattern.test(req.url));

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withNavigationErrorHandler(reloadOnChunkLoadError),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([serverTimeoutInterceptor, authInterceptor, errorInterceptor]),
    ),
    provideClientHydration(
      withEventReplay(),
      withIncrementalHydration(),
      withHttpTransferCacheOptions({
        includePostRequests: true,
        // The auth interceptor adds Authorization for logged-in users; without this the
        // browser ignores the SSR cache and refetches everything after hydration.
        includeRequestsWithAuthHeaders: true,
        filter: isTransferCacheable,
      }),
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: JournalPreset,
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            // Must match the @layer order declared first in styles.css, so Tailwind
            // preflight (base) doesn't override PrimeNG component styles.
            order: 'theme, base, primeng',
          },
        },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};
