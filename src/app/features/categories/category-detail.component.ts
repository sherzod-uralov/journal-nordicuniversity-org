import { Component, inject, OnInit, OnDestroy, input, signal } from '@angular/core';
import { CategoryStore } from '@store/category.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article } from '@core/models/article.model';
import { PaginatedResponse } from '@core/models/api-response.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { Paginator } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [ArticleCardComponent, BreadcrumbComponent, TranslatePipe, Paginator, Skeleton, Tag],
  templateUrl: './category-detail.component.html',
  styleUrl: './category-detail.component.css',
})
export class CategoryDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly categoryStore = inject(CategoryStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);
  readonly articles = signal<Article[]>([]);
  readonly totalPages = signal(0);
  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly articlesLoading = signal(false);

  ngOnInit(): void {
    const numId = Number(this.id());
    this.categoryStore.loadById(numId);
    this.loadArticles(1);
  }

  ngOnDestroy(): void { this.categoryStore.clearSelected(); }

  get breadcrumbs(): BreadcrumbItem[] {
    return [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Categories', translateKey: 'nav.categories', route: '/categories' }, { label: this.categoryStore.selectedCategory()?.name || '...' }];
  }

  get first(): number {
    return (this.currentPage() - 1) * 12;
  }

  loadArticles(page: number): void {
    this.articlesLoading.set(true);
    this.articleApi.getByCategory(Number(this.id()), { page, limit: 12 }).subscribe({
      next: (res: PaginatedResponse<Article>) => {
        this.articles.set(res.data);
        this.totalPages.set(res.totalPages);
        this.totalRecords.set(res.totalPages * 12);
        this.currentPage.set(res.currentPage);
        this.articlesLoading.set(false);
      },
      error: () => this.articlesLoading.set(false),
    });
  }

  onPageChange(event: { page?: number }): void {
    this.loadArticles((event.page ?? 0) + 1);
  }
}
