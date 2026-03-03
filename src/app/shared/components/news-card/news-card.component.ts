import { Component, input , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewsItem } from '@core/models/news.model';
import { ImageComponent } from '@shared/components/image/image.component';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [RouterLink, ImageComponent, DateLocalePipe, TruncatePipe, TranslatePipe],
  templateUrl: './news-card.component.html',
  styleUrl: './news-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsCardComponent {
  readonly news = input.required<NewsItem>();
}
