import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ArticleApiService } from '@services/api/article-api.service';
import { ArticleStore } from '@store/article.store';
import { Article } from '@core/models/article.model';

/**
 * Pre-fetches the article by slug before the component renders.
 * This ensures og:image and other SEO meta tags are set during SSR
 * serialization (not in effects which may run after serialization).
 *
 * The outcome — article or error/not-found — is recorded in ArticleStore, which the
 * component renders as-is: a failed load is never repeated by the component.
 */
export const articleResolver: ResolveFn<Article | null> = (route: ActivatedRouteSnapshot) => {
  const store = inject(ArticleStore);
  const api = inject(ArticleApiService);
  const slug = route.paramMap.get('slug')!;

  const cached = store.selectedArticle();
  if (cached?.slug === slug) {
    return of(cached);
  }

  return api.getBySlug(slug).pipe(
    map((article) => {
      if (article) {
        store.setSelected(article);
      } else {
        store.setSelectedError(new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
      }
      return article ?? null;
    }),
    catchError((err) => {
      store.setSelectedError(err);
      return of(null);
    }),
  );
};
