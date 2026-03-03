import { Component, inject, OnInit, OnDestroy, input, signal, computed , ChangeDetectionStrategy } from '@angular/core';
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
  imports: [ArticleCardComponent, PageHeaderComponent, EmptyStateComponent, TranslatePipe, ScrollAnimateDirective, Skeleton],
  templateUrl: './category-detail.component.html',
  styleUrl: './category-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly categoryStore = inject(CategoryStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);

  readonly articles = signal<Article[]>([]);
  readonly articlesLoading = signal(false);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Categories', translateKey: 'nav.categories', route: '/categories' },
    { label: this.categoryStore.selectedCategory()?.name || '...' },
  ]);

  readonly categoryName = computed(() => this.categoryStore.selectedCategory()?.name || '');

  ngOnInit(): void {
    const numId = Number(this.id());
    this.categoryStore.loadById(numId);
    this.loadArticles(numId);
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }

  private loadArticles(categoryId: number): void {
    this.articlesLoading.set(true);
    this.articleApi.getByCategory(categoryId).subscribe({
      next: (articles) => {
        this.articles.set(articles);
        this.articlesLoading.set(false);
        const name = this.categoryName() || 'Category';
        this.seo.update({
          title: name,
          description: `Browse articles in ${name} category`,
        });
      },
      error: () => this.articlesLoading.set(false),
    });
  }
}
