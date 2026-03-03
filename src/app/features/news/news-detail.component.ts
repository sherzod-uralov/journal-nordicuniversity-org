import { Component, inject, OnInit, OnDestroy, input, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { NewsStore } from '@store/news.store';
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
  readonly newsStore = inject(NewsStore);
  private readonly seo = inject(SeoService);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const n = this.newsStore.selectedNews();
    return [
      { label: 'Home', translateKey: 'nav.home', route: '/' },
      { label: 'News', translateKey: 'nav.news', route: '/news' },
      { label: n?.title || '...' },
    ];
  });

  constructor() {
    effect(() => {
      const n = this.newsStore.selectedNews();
      if (n) {
        const apiBase = environment.apiUrl.replace(/\/+$/, '');
        const ogImage = n.source?.file_path
          ? `${apiBase}/${n.source.file_path.replace(/^\/+/, '')}`
          : undefined;
        this.seo.update({
          title: n.title,
          description: n.description?.substring(0, 200) || '',
          ogImage,
          ogType: 'article',
        });
      }
    });
  }

  ngOnInit(): void {
    this.newsStore.loadBySlug(this.slug());
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }
}
