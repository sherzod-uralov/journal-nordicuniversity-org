import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Article } from '@core/models/article.model';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [RouterLink, FileUrlPipe, TruncatePipe, DateLocalePipe],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css',
})
export class ArticleCardComponent {
  readonly article = input.required<Article>();
  readonly compact = input(false);
}
