import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { BookmarkStore } from '@store/bookmark.store';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [PageHeaderComponent, ArticleCardComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookmarksComponent implements OnInit {
  readonly bookmarkStore = inject(BookmarkStore);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Bookmarks', translateKey: 'bookmarks.title' },
  ];

  ngOnInit(): void {
    this.bookmarkStore.load();
  }

  clearAll(): void {
    this.bookmarkStore.clear();
  }
}
