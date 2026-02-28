import { Component, inject, OnInit } from '@angular/core';
import { NewsStore } from '@store/news.store';
import { NewsCardComponent } from '@shared/components/news-card/news-card.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { Paginator } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [NewsCardComponent, PageHeaderComponent, TranslatePipe, Paginator, Skeleton],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.css',
})
export class NewsListComponent implements OnInit {
  readonly newsStore = inject(NewsStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'News', translateKey: 'nav.news' }];

  ngOnInit(): void {
    this.seo.update({ title: 'News' });
    this.newsStore.loadNews({ page: 1, limit: 12 });
  }

  get first(): number {
    return (this.newsStore.currentPage() - 1) * 12;
  }

  onPageChange(event: { page?: number }): void {
    this.newsStore.loadNews({ page: (event.page ?? 0) + 1, limit: 12 });
  }
}
