import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '@core/services/language.service';

const MONTHS: Record<string, { short: string[]; long: string[] }> = {
  uz: {
    short: ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'],
    long: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  },
  ru: {
    short: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    long: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  },
  en: {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

@Pipe({ name: 'dateLocale', pure: false, standalone: true })
export class DateLocalePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const lang = this.languageService.lang();
    const m = MONTHS[lang] ?? MONTHS['en'];
    const day = date.getDate();
    const month = m[format][date.getMonth()];
    const year = date.getFullYear();

    if (lang === 'en') {
      return format === 'long'
        ? `${month} ${day}, ${year}`
        : `${month} ${day}, ${year}`;
    }
    // uz / ru: "27 fevral 2026" or "27 fev, 2026"
    return format === 'long'
      ? `${day} ${month} ${year}`
      : `${day} ${month}, ${year}`;
  }
}
