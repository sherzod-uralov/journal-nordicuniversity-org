import { Component, inject, input, OnInit, OnDestroy, signal, computed, effect, untracked, ChangeDetectionStrategy, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArticleStore } from '@store/article.store';
import { BookmarkStore } from '@store/bookmark.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { SeoService } from '@core/services/seo.service';
import { TagComponent } from '@shared/components/tag/tag.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { Skeleton } from 'primeng/skeleton';
import { CollapsibleComponent } from '@shared/components/collapsible/collapsible.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

import { ImageComponent } from '@shared/components/image/image.component';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { PdfViewerComponent } from '@shared/components/pdf-viewer/pdf-viewer.component';
import { environment } from '@env';
import { Article } from '@core/models/article.model';
import {
  CitationData, CitationStyle, CITATION_STYLES,
  ExportFormat, EXPORT_FORMATS,
  formatCitation, exportBibTeX, exportRIS, exportCSLJSON, exportEndNoteXML,
  exportPlainText, exportCSV, exportMODSXML, exportRefer, exportMARCXML, exportJATSXML,
  downloadFile,
} from '@core/utils/citation.util';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    RouterLink, TagComponent,
    PageHeaderComponent, Skeleton,
    CollapsibleComponent,
    AvatarComponent, ArticleCardComponent, DateLocalePipe, TranslatePipe,
    SafeHtmlPipe, ImageComponent,
    ScrollAnimateDirective, ClickOutsideDirective, PdfViewerComponent,
  ],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();
  /** Pre-fetched by articleResolver — available synchronously in ngOnInit for SSR SEO */
  readonly preloadedArticle = input<Article | null>(null);
  readonly articleStore = inject(ArticleStore);
  readonly bookmarkStore = inject(BookmarkStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly apiUrl = environment.apiUrl;

  readonly showShareMenu = signal(false);
  readonly copiedLink = signal(false);
  readonly readingMode = signal(false);
  readonly copiedCitation = signal(false);

  readonly copiedDoi = signal(false);
  readonly relatedArticles = signal<Article[]>([]);
  readonly relatedLoading = signal(false);
  readonly sliderIndex = signal(0);

  private readonly sliderRef = viewChild<ElementRef>('relatedSlider');

  readonly selectedCitationStyle = signal<CitationStyle>('APA');
  readonly citationStyles = CITATION_STYLES;
  readonly exportFormats = EXPORT_FORMATS;

  readonly styleDropdownOpen = signal(false);
  readonly exportDropdownOpen = signal(false);

  readonly selectedStyleLabel = computed(() =>
    this.citationStyles.find(s => s.value === this.selectedCitationStyle())?.label ?? 'APA'
  );

  readonly article = computed(() => this.articleStore.selectedArticle());

  private lastArticleId: string | null = null;
  private relatedSub?: Subscription;

  constructor() {
    // Only track slug() — wrap everything else in untracked to prevent
    // loadBySlug's tap (which reads store.selectedArticle()) from being
    // accidentally tracked, which would cause an infinite fetch loop.
    effect(() => {
      const slug = this.slug();
      untracked(() => {
        if (slug) {
          this.lastArticleId = null;
          this.relatedSub?.unsubscribe();
          this.relatedArticles.set([]);
          this.relatedLoading.set(false);
          this.sliderIndex.set(0);
          // loadBySlug skips HTTP if resolver already pre-loaded this slug
          this.articleStore.loadBySlug(slug);
        }
      });
    });

    // Only track article() — SEO is set in ngOnInit from preloadedArticle.
    // This effect handles the fallback case (e.g., SPA navigation without resolver cache).
    effect(() => {
      const a = this.article();
      untracked(() => {
        if (a && a.id !== this.lastArticleId) {
          this.lastArticleId = a.id;
          this.applyArticleSeo(a);
          this.loadRelatedArticles(a);
        }
      });
    });
  }

  ngOnInit(): void {
    // Set SEO synchronously from resolver data — this runs in ngOnInit which
    // is zone-tracked, so Angular SSR serializes HTML AFTER this executes.
    const preloaded = this.preloadedArticle();
    if (preloaded) {
      this.lastArticleId = preloaded.id;
      this.applyArticleSeo(preloaded);
      this.loadRelatedArticles(preloaded);
    }
  }

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const a = this.article();
    return [
      { label: 'Home', translateKey: 'nav.home', route: '/' },
      { label: 'Articles', translateKey: 'nav.articles', route: '/articles' },
      { label: a?.title || '...' },
    ];
  });

  readonly keywords = computed<string[]>(() => {
    const kw = this.article()?.keyword;
    if (!kw) return [];
    return kw.split(',').map(k => k.trim()).filter(Boolean);
  });

  readonly pdfUrl = computed(() => {
    const a = this.article();
    if (!a?.file?.file_path) return '';
    const base = this.apiUrl.replace(/\/+$/, '');
    const path = a.file.file_path.replace(/^\/+/, '');
    return `${base}/${path}`;
  });

  readonly citationData = computed<CitationData | null>(() => {
    const a = this.article();
    if (!a) return null;
    const authors: string[] = [];
    if (a.author?.full_name) authors.push(a.author.full_name);
    if (a.coAuthors?.length) {
      for (const co of a.coAuthors) authors.push(co.full_name);
    }
    return {
      authors,
      title: a.title,
      journalTitle: 'International Nordic University Scientific Journal',
      volume: a.volume?.title ?? undefined,
      firstPage: a.first_page_in_volume,
      lastPage: a.last_page_in_volume,
      doi: a.doi,
      publishDate: a.publish_date,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  });

  readonly citationText = computed(() => {
    const data = this.citationData();
    if (!data) return '';
    return formatCitation(data, this.selectedCitationStyle());
  });

  readonly articleUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  });

  ngOnDestroy(): void {
    this.seo.resetMeta();
    this.relatedSub?.unsubscribe();
  }

  downloadPdf(): void {
    const url = this.pdfUrl();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  toggleBookmark(): void {
    const a = this.article();
    if (a) this.bookmarkStore.toggle(a);
  }

  printArticle(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }

  copyDoi(): void {
    const doi = this.article()?.doi;
    if (!doi) return;
    navigator.clipboard.writeText(`https://doi.org/${doi}`).then(() => {
      this.copiedDoi.set(true);
      setTimeout(() => this.copiedDoi.set(false), 2000);
    });
  }

  private loadRelatedArticles(a: Article): void {
    if (!a.categoryId) return;
    this.relatedSub?.unsubscribe();
    this.relatedLoading.set(true);
    this.relatedSub = this.articleApi.getByCategory(a.categoryId).subscribe({
      next: (articles) => {
        this.relatedArticles.set(articles.filter(r => r.id !== a.id).slice(0, 8));
        this.relatedLoading.set(false);
      },
      error: () => this.relatedLoading.set(false),
    });
  }

  slideNext(): void {
    const el = this.sliderRef()?.nativeElement;
    if (!el) return;
    const slideWidth = el.querySelector('.related-slide')?.offsetWidth ?? 300;
    el.scrollBy({ left: slideWidth + 20, behavior: 'smooth' });
  }

  slidePrev(): void {
    const el = this.sliderRef()?.nativeElement;
    if (!el) return;
    const slideWidth = el.querySelector('.related-slide')?.offsetWidth ?? 300;
    el.scrollBy({ left: -(slideWidth + 20), behavior: 'smooth' });
  }

  onCitationStyleChange(style: CitationStyle): void {
    this.selectedCitationStyle.set(style);
    this.styleDropdownOpen.set(false);
  }

  toggleStyleDropdown(): void {
    this.styleDropdownOpen.update(v => !v);
    this.exportDropdownOpen.set(false);
  }

  closeStyleDropdown(): void {
    this.styleDropdownOpen.set(false);
  }

  toggleExportDropdown(): void {
    this.exportDropdownOpen.update(v => !v);
    this.styleDropdownOpen.set(false);
  }

  closeExportDropdown(): void {
    this.exportDropdownOpen.set(false);
  }

  copyCitation(): void {
    navigator.clipboard.writeText(this.citationText()).then(() => {
      this.copiedCitation.set(true);
      setTimeout(() => this.copiedCitation.set(false), 2000);
    });
  }

  exportCitation(format: ExportFormat): void {
    const data = this.citationData();
    if (!data) return;
    const slug = this.article()?.slug ?? 'article';
    this.exportDropdownOpen.set(false);

    switch (format) {
      case 'bibtex':
        downloadFile(exportBibTeX(data), `${slug}.bib`, 'application/x-bibtex');
        break;
      case 'ris':
        downloadFile(exportRIS(data), `${slug}.ris`, 'application/x-research-info-systems');
        break;
      case 'csl-json':
        downloadFile(exportCSLJSON(data), `${slug}.json`, 'application/json');
        break;
      case 'endnote-xml':
        downloadFile(exportEndNoteXML(data), `${slug}.xml`, 'application/xml');
        break;
      case 'plain-text':
        downloadFile(exportPlainText(data), `${slug}.txt`, 'text/plain');
        break;
      case 'csv':
        downloadFile(exportCSV(data), `${slug}.csv`, 'text/csv');
        break;
      case 'mods-xml':
        downloadFile(exportMODSXML(data), `${slug}-mods.xml`, 'application/xml');
        break;
      case 'refer':
        downloadFile(exportRefer(data), `${slug}.refer`, 'text/plain');
        break;
      case 'marc-xml':
        downloadFile(exportMARCXML(data), `${slug}-marc.xml`, 'application/xml');
        break;
      case 'jats-xml':
        downloadFile(exportJATSXML(data), `${slug}-jats.xml`, 'application/xml');
        break;
    }
  }

  toggleShareMenu(): void {
    this.showShareMenu.update(v => !v);
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.articleUrl()).then(() => {
      this.copiedLink.set(true);
      this.showShareMenu.set(false);
      setTimeout(() => this.copiedLink.set(false), 2000);
    });
  }

  shareToTelegram(): void {
    const url = encodeURIComponent(this.articleUrl());
    const text = encodeURIComponent(this.article()?.title ?? '');
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  }

  shareToTwitter(): void {
    const url = encodeURIComponent(this.articleUrl());
    const text = encodeURIComponent(this.article()?.title ?? '');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  }

  shareToFacebook(): void {
    const url = encodeURIComponent(this.articleUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
  }

  private applyArticleSeo(a: Article): void {
    const base = this.apiUrl.replace(/\/+$/, '');
    const articleUrl = this.seo.getFullUrl(`/articles/${a.slug}`);

    const authors: { name: string; orcid?: string }[] = [];
    if (a.author) {
      authors.push({ name: a.author.full_name, orcid: a.author.OrcID || undefined });
    }
    if (a.coAuthors?.length) {
      for (const co of a.coAuthors) {
        authors.push({ name: co.full_name, orcid: co.OrcID || undefined });
      }
    }

    const keywords = a.keyword
      ? a.keyword.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    const pdfUrl = a.file?.file_path
      ? `${base}/${a.file.file_path.replace(/^\/+/, '')}`
      : undefined;

    const imageUrl = a.image?.file_path
      ? `${base}/${a.image.file_path.replace(/^\/+/, '')}`
      : undefined;

    this.seo.setArticleSeo({
      title: a.title,
      abstract: a.abstract || '',
      authors,
      doi: a.doi || undefined,
      publishDate: a.publish_date || undefined,
      journalTitle: 'International Nordic University Scientific Journal',
      volume: a.volume?.title || undefined,
      firstPage: a.first_page_in_volume || undefined,
      lastPage: a.last_page_in_volume || undefined,
      keywords,
      pdfUrl,
      articleUrl,
      imageUrl,
      language: 'en',
      publisher: 'International Nordic University',
    });
  }
}
