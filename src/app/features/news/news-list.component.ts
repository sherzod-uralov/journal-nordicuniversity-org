import { Component, inject, OnInit, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { NewsStore } from '@store/news.store';
import { NewsCardComponent } from '@shared/components/news-card/news-card.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { LanguageService } from '@core/services/language.service';

import { SeoService } from '@core/services/seo.service';
import { Skeleton } from 'primeng/skeleton';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [NewsCardComponent, PageHeaderComponent, Skeleton, PaginationComponent],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsListComponent implements OnInit {
  readonly newsStore = inject(NewsStore);
  private readonly seo = inject(SeoService);
  private readonly language = inject(LanguageService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'News', translateKey: 'nav.news' }];

  private loadedLang = this.language.lang();

  constructor() {
    // News is localized server-side: reload the list when the language changes
    effect(() => {
      const lang = this.language.lang();
      untracked(() => {
        if (lang === this.loadedLang) return;
        this.loadedLang = lang;
        this.newsStore.loadNews({ page: 1, limit: 12 });
      });
    });
  }

  ngOnInit(): void {
    this.seo.update({ title: 'News', description: 'Latest news and announcements from the journal' });
    this.loadedLang = this.language.lang();
    this.newsStore.loadNews({ page: 1, limit: 12 });
  }

  onPageChange(page: number): void {
    this.newsStore.loadNews({ page, limit: 12 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
