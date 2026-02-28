import { Component, inject, OnInit, OnDestroy, input } from '@angular/core';
import { NewsStore } from '@store/news.store';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { Skeleton } from 'primeng/skeleton';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { LocalizePipe } from '@shared/pipes/localize.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { SeoService } from '@core/services/seo.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [BreadcrumbComponent, Skeleton, FileUrlPipe, LocalizePipe, DateLocalePipe, SafeHtmlPipe],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.css',
})
export class NewsDetailComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();
  readonly newsStore = inject(NewsStore);
  private readonly seo = inject(SeoService);

  ngOnInit(): void { this.newsStore.loadBySlug(this.slug()); }
  ngOnDestroy(): void { this.newsStore.clearSelected(); }

  get breadcrumbs(): BreadcrumbItem[] {
    const n = this.newsStore.selectedNews();
    return [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'News', translateKey: 'nav.news', route: '/news' }, { label: n ? n.news_title_en || '...' : '...' }];
  }
}
