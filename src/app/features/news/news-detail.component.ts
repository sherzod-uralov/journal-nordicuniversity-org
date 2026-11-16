import { Component, inject, OnInit, OnDestroy, input, computed, effect, untracked, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NewsStore } from '@store/news.store';
import { NewsApiService } from '@services/api/news-api.service';
import { NewsItem } from '@core/models/news.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { Skeleton } from 'primeng/skeleton';
import { ImageComponent } from '@shared/components/image/image.component';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { LanguageService } from '@core/services/language.service';
import { environment } from '@env';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, EmptyStateComponent, Skeleton, ImageComponent, DateLocalePipe, SafeHtmlPipe, TranslatePipe],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsDetailComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();
  /** Pre-fetched by newsResolver — available synchronously in ngOnInit for SSR SEO */
  readonly preloadedNews = input<NewsItem | null>(null);
  readonly newsStore = inject(NewsStore);
  private readonly newsApi = inject(NewsApiService);
  private readonly seo = inject(SeoService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiBase = environment.apiUrl.replace(/\/+$/, '');

  private loadedLang = this.language.lang();
  private langSwitchSub?: Subscription;

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const n = this.newsStore.selectedNews();
    return [
      { label: 'Home', translateKey: 'nav.home', route: '/' },
      { label: 'News', translateKey: 'nav.news', route: '/news' },
      { label: n?.title || '...' },
    ];
  });

  constructor() {
    // Apply SEO whenever selectedNews updates (the resolver loads it — or records the
    // error — for every slug, so this component never refetches it itself).
    effect(() => {
      const n = this.newsStore.selectedNews();
      const notFound = this.newsStore.notFound();
      untracked(() => {
        if (n) {
          this.applyNewsSeo(n);
        } else if (notFound && !this.newsStore.loading()) {
          this.seo.update({ title: 'News not found' });
          this.seo.markNotFound();
        }
      });
    });

    // News content (and slug) is per language: follow language switches
    effect(() => {
      const lang = this.language.lang();
      untracked(() => {
        if (lang === this.loadedLang) return;
        this.loadedLang = lang;
        this.switchLanguage();
      });
    });
  }

  ngOnInit(): void {
    // Set SEO synchronously from resolver data so it's in place before SSR serialization
    const preloaded = this.preloadedNews();
    if (preloaded) {
      this.applyNewsSeo(preloaded);
    }
  }

  /** Retries a failed load (explicit user action). */
  retry(): void {
    this.newsStore.loadBySlug(this.slug());
  }

  /**
   * Slugs differ per language, so find the same item (by id) in the new language's list
   * and move to its slug; fall back to reloading the current slug.
   */
  private switchLanguage(): void {
    const current = this.newsStore.selectedNews();
    this.langSwitchSub?.unsubscribe();
    if (!current) {
      this.newsStore.loadBySlug(this.slug());
      return;
    }
    this.langSwitchSub = this.newsApi.getList({ page: 1, limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const translated = res.data?.find(n => n.id === current.id);
          if (!translated) {
            this.newsStore.loadBySlug(this.slug());
            return;
          }
          this.newsStore.setSelected(translated);
          if (translated.slug !== this.slug()) {
            this.router.navigate(['/news', translated.slug], { replaceUrl: true });
          }
        },
        error: () => this.newsStore.loadBySlug(this.slug()),
      });
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
