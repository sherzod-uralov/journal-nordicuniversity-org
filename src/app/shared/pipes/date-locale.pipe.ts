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

/**
 * Calendar parts in the journal's time zone. Server (UTC) and browser (any zone) must
 * render the same day, otherwise hydration flips the text near midnight.
 */
const DISPLAY_TIME_ZONE = 'Asia/Tashkent';
const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function zonedParts(date: Date): { year: number; month: number; day: number } {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value);
  return { year: get('year'), month: get('month') - 1, day: get('day') };
}

@Pipe({ name: 'dateLocale', pure: false, standalone: true })
export class DateLocalePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const lang = this.languageService.lang();
    const m = MONTHS[lang] ?? MONTHS['en'];
    const parts = zonedParts(date);
    const day = parts.day;
    const month = m[format][parts.month];
    const year = parts.year;

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
