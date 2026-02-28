import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewsItem } from '@core/models/news.model';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [RouterLink, FileUrlPipe, DateLocalePipe, TruncatePipe, TranslatePipe],
  templateUrl: './news-card.component.html',
  styleUrl: './news-card.component.css',
})
export class NewsCardComponent {
  readonly news = input.required<NewsItem>();
}
