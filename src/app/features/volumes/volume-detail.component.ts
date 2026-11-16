import { Component, inject, OnInit, OnDestroy, input, signal, computed, effect, untracked, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

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

/** Plain text of an HTML fragment, whitespace collapsed (SSR-safe, no DOM). */
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

@Component({
  selector: 'app-volume-detail',
  standalone: true,
  imports: [
    RouterLink, ArticleCardComponent, Skeleton,
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
  private readonly destroyRef = inject(DestroyRef);

  readonly articles = signal<Article[]>([]);
  readonly loadingArticles = signal(true);
  /** The URL id isn't a valid volume id. */
  readonly invalidId = signal(false);

  /** Selected volume, only when it matches the URL (never the previous one). */
  readonly volume = computed(() => {
    const v = this.volumeStore.selectedVolume();
    return v && v.id === Number(this.id()) ? v : null;
  });
  readonly notFound = computed(() => this.invalidId() || this.volumeStore.notFound());

  private loadedId: string | null = null;
  private articlesSub?: Subscription;

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Volumes', translateKey: 'nav.volumes', route: '/volumes' },
    { label: this.volume()?.title || '...' },
  ]);

  constructor() {
    effect(() => {
      const v = this.volume();
      const notFound = this.notFound();
      untracked(() => {
        if (v) {
          const apiBase = environment.apiUrl.replace(/\/+$/, '');
          const ogImage = v.image?.file_path
            ? `${apiBase}/${v.image.file_path.replace(/^\/+/, '')}`
            : undefined;
          this.seo.update({
            title: v.title,
            description: v.description || stripHtml(v.text).substring(0, 200),
            ogImage,
          });
        } else if (notFound && !this.volumeStore.loading()) {
          this.seo.update({ title: 'Volume not found' });
          this.seo.markNotFound();
        }
      });
    });

    // Reload when the component is reused for another volume id
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  ngOnInit(): void {
    this.load(this.id());
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
      this.loadingArticles.set(false);
      return;
    }
    this.volumeStore.loadById(numId);
    this.loadingArticles.set(true);
    this.articlesSub = this.articleApi.getByVolume(numId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
