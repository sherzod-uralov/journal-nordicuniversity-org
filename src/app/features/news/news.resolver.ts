import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { NewsApiService } from '@services/api/news-api.service';
import { NewsStore } from '@store/news.store';
import { NewsItem } from '@core/models/news.model';

/**
 * Pre-fetches the news item by slug before the component renders.
 * Ensures SEO meta tags (og:image, og:title, etc.) are set during
 * SSR serialization rather than in effects which may run after.
 */
export const newsResolver: ResolveFn<NewsItem | null> = (route: ActivatedRouteSnapshot) => {
  const store = inject(NewsStore);
  const api = inject(NewsApiService);
  const slug = route.paramMap.get('slug')!;

  const cached = store.selectedNews();
  if (cached?.slug === slug) {
    return of(cached);
  }

  return api.getBySlug(slug).pipe(
    tap(news => store.setSelected(news)),
    catchError(() => of(null)),
  );
};
