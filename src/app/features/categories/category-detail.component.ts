import { Component, inject, OnInit, OnDestroy, input, signal, computed, effect, untracked, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryStore } from '@store/category.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article } from '@core/models/article.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { SeoService } from '@core/services/seo.service';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [RouterLink, ArticleCardComponent, PageHeaderComponent, EmptyStateComponent, TranslatePipe, ScrollAnimateDirective, Skeleton],
  templateUrl: './category-detail.component.html',
  styleUrl: './category-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly categoryStore = inject(CategoryStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly articles = signal<Article[]>([]);
  readonly articlesLoading = signal(false);
  /** The URL id isn't a valid category id. */
  readonly invalidId = signal(false);

  /** Selected category, only when it matches the URL (never the previous one). */
  readonly category = computed(() => {
    const c = this.categoryStore.selectedCategory();
    return c && c.id === Number(this.id()) ? c : null;
  });
  readonly notFound = computed(() => this.invalidId() || this.categoryStore.notFound());
  readonly loadFailed = computed(() =>
    !this.category() && !this.categoryStore.loading() && (this.notFound() || !!this.categoryStore.error())
  );

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Categories', translateKey: 'nav.categories', route: '/categories' },
    { label: this.category()?.name || '...' },
  ]);

  readonly categoryName = computed(() => this.category()?.name || '');

  private loadedId: string | null = null;
  private articlesSub?: Subscription;

  constructor() {
    // SEO follows the category matching the URL — independent of which request finishes first
    effect(() => {
      const c = this.category();
      const failed = this.loadFailed();
      const notFound = this.notFound();
      untracked(() => {
        if (c) {
          this.seo.update({
            title: c.name,
            description: `Browse articles in ${c.name} category`,
          });
        } else if (failed && notFound) {
          this.seo.update({ title: 'Category not found' });
          this.seo.markNotFound();
        }
      });
    });

    // Reload when the component is reused for another category id
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  ngOnInit(): void {
    this.load(this.id());
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }

  /** Retries a failed load (explicit user action). */
  retry(): void {
    this.loadedId = null;
    this.load(this.id());
  }

  private load(id: string): void {
    if (id === this.loadedId) return;
    this.loadedId = id;
    const numId = Number(id);
    this.articlesSub?.unsubscribe();
    this.articles.set([]);
    this.invalidId.set(!Number.isInteger(numId) || numId <= 0);
    if (this.invalidId()) {
      this.articlesLoading.set(false);
      return;
    }
    this.categoryStore.loadById(numId);
    this.loadArticles(numId);
  }

  private loadArticles(categoryId: number): void {
    this.articlesLoading.set(true);
    this.articlesSub = this.articleApi.getByCategory(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (articles) => {
          this.articles.set(articles);
          this.articlesLoading.set(false);
        },
        error: () => this.articlesLoading.set(false),
      });
  }
}
