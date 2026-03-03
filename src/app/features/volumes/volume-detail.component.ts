import { Component, inject, OnInit, OnDestroy, input, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';

import { VolumeStore } from '@store/volume.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article } from '@core/models/article.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { Skeleton } from 'primeng/skeleton';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';

import { ImageComponent } from '@shared/components/image/image.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { SeoService } from '@core/services/seo.service';
import { environment } from '@env';

@Component({
  selector: 'app-volume-detail',
  standalone: true,
  imports: [
    ArticleCardComponent, Skeleton,
    EmptyStateComponent, PageHeaderComponent, ImageComponent,
    TranslatePipe, SafeHtmlPipe, DateLocalePipe, ScrollAnimateDirective,
  ],
  templateUrl: './volume-detail.component.html',
  styleUrl: './volume-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly volumeStore = inject(VolumeStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);

  readonly articles = signal<Article[]>([]);
  readonly loadingArticles = signal(true);

  readonly volume = computed(() => this.volumeStore.selectedVolume());

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Volumes', translateKey: 'nav.volumes', route: '/volumes' },
    { label: this.volume()?.title || '...' },
  ]);

  constructor() {
    effect(() => {
      const v = this.volume();
      if (v) {
        const apiBase = environment.apiUrl.replace(/\/+$/, '');
        const ogImage = v.image?.file_path
          ? `${apiBase}/${v.image.file_path.replace(/^\/+/, '')}`
          : undefined;
        this.seo.update({
          title: v.title,
          description: v.description || v.text?.substring(0, 200) || '',
          ogImage,
        });
      }
    });
  }

  ngOnInit(): void {
    const numId = Number(this.id());
    this.volumeStore.loadById(numId);
    this.articleApi.getByVolume(numId).subscribe({
      next: (a) => {
        this.articles.set(a);
        this.loadingArticles.set(false);
      },
      error: () => this.loadingArticles.set(false),
    });
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }

  downloadSource(): void {
    const v = this.volume();
    if (v?.source?.file_path) {
      const base = environment.apiUrl.replace(/\/+$/, '');
      const path = v.source.file_path.replace(/^\/+/, '');
      window.open(`${base}/${path}`, '_blank', 'noopener,noreferrer');
    }
  }
}
