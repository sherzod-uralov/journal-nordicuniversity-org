import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { News } from '@core/models/news.model';
import { LanguageService } from '@core/services/language.service';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { LocalizePipe } from '@shared/pipes/localize.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [RouterLink, FileUrlPipe, LocalizePipe, DateLocalePipe, TruncatePipe, TranslatePipe],
  templateUrl: './news-card.component.html',
  styleUrl: './news-card.component.css',
})
export class NewsCardComponent {
  readonly news = input.required<News>();
  private readonly langService = inject(LanguageService);

  get slug(): string {
    const lang = this.langService.lang();
    const n = this.news();
    return n[`slug_${lang}` as keyof News] as string || n.slug_en || n.slug_uz;
  }
}
