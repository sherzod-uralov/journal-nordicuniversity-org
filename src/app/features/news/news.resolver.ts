import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { NewsApiService } from '@services/api/news-api.service';
import { NewsStore } from '@store/news.store';
import { LanguageService } from '@core/services/language.service';
import { NewsItem } from '@core/models/news.model';

/**
 * Pre-fetches the news item by slug before the component renders.
 * Ensures SEO meta tags (og:image, og:title, etc.) are set during
 * SSR serialization rather than in effects which may run after.
 *
 * The outcome — item or error/not-found — is recorded in NewsStore, which the
 * component renders as-is: a failed load is never repeated by the component.
 */
export const newsResolver: ResolveFn<NewsItem | null> = (route: ActivatedRouteSnapshot) => {
  const store = inject(NewsStore);
  const api = inject(NewsApiService);
  const lang = inject(LanguageService).lang();
  const slug = route.paramMap.get('slug')!;

  // Cached only when it was loaded in the current language
  if (store.isSelected(slug)) {
    return of(store.selectedNews());
  }

  return api.getBySlug(slug).pipe(
    map((news) => {
      if (news) {
        store.setSelected(news, lang);
      } else {
        store.setSelectedError(new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
      }
      return news ?? null;
    }),
    catchError((err) => {
      store.setSelectedError(err);
      return of(null);
    }),
  );
};
