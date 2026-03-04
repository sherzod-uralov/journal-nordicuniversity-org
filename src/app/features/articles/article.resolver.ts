import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { ArticleApiService } from '@services/api/article-api.service';
import { ArticleStore } from '@store/article.store';
import { Article } from '@core/models/article.model';

/**
 * Pre-fetches the article by slug before the component renders.
 * This ensures og:image and other SEO meta tags are set during SSR
 * serialization (not in effects which may run after serialization).
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
    tap(article => store.setSelected(article)),
    catchError(() => of(null)),
  );
};
