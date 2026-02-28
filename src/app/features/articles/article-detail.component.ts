import { Component, inject, OnInit, input, OnDestroy, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleStore } from '@store/article.store';
import { SeoService } from '@core/services/seo.service';
import { TagComponent } from '@shared/components/tag/tag.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { Skeleton } from 'primeng/skeleton';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { environment } from '@env';
import { Article } from '@core/models/article.model';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    RouterLink, TagComponent,
    BreadcrumbComponent, Skeleton,
    AvatarComponent, DateLocalePipe, TranslatePipe,
    SafeHtmlPipe, FileUrlPipe, ScrollAnimateDirective,
  ],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css',
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();
  readonly articleStore = inject(ArticleStore);
  private readonly seo = inject(SeoService);
  readonly apiUrl = environment.apiUrl;

  readonly showCiteModal = signal(false);
  readonly copiedCitation = signal(false);
  readonly showShareMenu = signal(false);
  readonly copiedLink = signal(false);

  readonly article = computed(() => this.articleStore.selectedArticle());

  constructor() {
    effect(() => {
      const a = this.article();
      if (a) this.applyArticleSeo(a);
    });
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

  readonly citationText = computed(() => {
    const a = this.article();
    if (!a) return '';
    const authors = a.author?.full_name ?? '';
    const year = a.publish_date ? new Date(a.publish_date).getFullYear() : '';
    const vol = a.volume?.title ?? '';
    const pages = a.first_page_in_volume && a.last_page_in_volume
      ? `, pp. ${a.first_page_in_volume}-${a.last_page_in_volume}` : '';
    const doi = a.doi ? `. https://doi.org/${a.doi}` : '';
    return `${authors} (${year}). ${a.title}. Nordic University Scientific Journal, ${vol}${pages}${doi}`;
  });

  readonly articleUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  });

  ngOnInit(): void {
    this.articleStore.loadBySlug(this.slug());
  }

  ngOnDestroy(): void {
    this.articleStore.clearSelected();
    this.seo.resetMeta();
  }

  downloadPdf(): void {
    const a = this.article();
    if (a?.file?.file_path) {
      const base = this.apiUrl.replace(/\/+$/, '');
      const path = a.file.file_path.replace(/^\/+/, '');
      window.open(`${base}/${path}`, '_blank');
    }
  }

  copyCitation(): void {
    navigator.clipboard.writeText(this.citationText()).then(() => {
      this.copiedCitation.set(true);
      setTimeout(() => this.copiedCitation.set(false), 2000);
    });
  }

  toggleCiteModal(): void {
    this.showCiteModal.update(v => !v);
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
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }

  shareToTwitter(): void {
    const url = encodeURIComponent(this.articleUrl());
    const text = encodeURIComponent(this.article()?.title ?? '');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  }

  shareToFacebook(): void {
    const url = encodeURIComponent(this.articleUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  private applyArticleSeo(a: Article): void {
    const base = this.apiUrl.replace(/\/+$/, '');
    const articleUrl = typeof window !== 'undefined' ? window.location.href : `https://journal.nordicun.uz/articles/${a.slug}`;

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
      journalTitle: 'Nordic University Scientific Journal',
      volume: a.volume?.title || undefined,
      firstPage: a.first_page_in_volume || undefined,
      lastPage: a.last_page_in_volume || undefined,
      keywords,
      pdfUrl,
      articleUrl,
      imageUrl,
      language: 'en',
      publisher: 'Nordic University',
    });
  }
}
