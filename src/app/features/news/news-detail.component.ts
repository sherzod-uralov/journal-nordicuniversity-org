import { Component, inject, OnInit, OnDestroy, input, computed, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { NewsStore } from '@store/news.store';
import { NewsItem } from '@core/models/news.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { Skeleton } from 'primeng/skeleton';
import { ImageComponent } from '@shared/components/image/image.component';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { SeoService } from '@core/services/seo.service';
import { environment } from '@env';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [PageHeaderComponent, Skeleton, ImageComponent, DateLocalePipe, SafeHtmlPipe],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsDetailComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();
  /** Pre-fetched by newsResolver — available synchronously in ngOnInit for SSR SEO */
  readonly preloadedNews = input<NewsItem | null>(null);
  readonly newsStore = inject(NewsStore);
  private readonly seo = inject(SeoService);
  private readonly apiBase = environment.apiUrl.replace(/\/+$/, '');

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const n = this.newsStore.selectedNews();
    return [
      { label: 'Home', translateKey: 'nav.home', route: '/' },
      { label: 'News', translateKey: 'nav.news', route: '/news' },
      { label: n?.title || '...' },
    ];
  });

  constructor() {
    // Fallback: apply SEO whenever selectedNews updates (handles edge cases
    // where resolver failed or SPA navigation bypassed the cache).
    effect(() => {
      const n = this.newsStore.selectedNews();
      untracked(() => {
        if (n) this.applyNewsSeo(n);
      });
    });
  }

  ngOnInit(): void {
    // Set SEO synchronously from resolver data — zone-tracked, runs before SSR serialization
    const preloaded = this.preloadedNews();
    if (preloaded) {
      this.applyNewsSeo(preloaded);
    }
    // loadBySlug skips HTTP if resolver already pre-loaded this slug
    this.newsStore.loadBySlug(this.slug());
  }

  private applyNewsSeo(n: NewsItem): void {
    const ogImage = n.source?.file_path
      ? `${this.apiBase}/${n.source.file_path.replace(/^\/+/, '')}`
      : undefined;
    this.seo.update({
      title: n.title,
      description: n.description?.substring(0, 200) || '',
      ogImage,
      ogType: 'article',
    });
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }
}
