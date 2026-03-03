import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Article } from '@core/models/article.model';
import { ImageComponent } from '@shared/components/image/image.component';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { BookmarkStore } from '@store/bookmark.store';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [RouterLink, ImageComponent, TruncatePipe, DateLocalePipe],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent {
  readonly article = input.required<Article>();
  readonly compact = input(false);
  readonly bookmarkStore = inject(BookmarkStore);

  toggleBookmark(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.bookmarkStore.toggle(this.article());
  }
}
