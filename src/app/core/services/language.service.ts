import { Injectable, signal, computed, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export type Language = 'uz' | 'ru' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly currentLang = signal<Language>('en');
  private readonly translations = signal<Record<string, string>>({});

  readonly language = this.currentLang.asReadonly();
  readonly lang = computed(() => this.currentLang());

  constructor() {
    this.loadTranslations('en');

    afterNextRender(() => {
      const stored = (localStorage.getItem('lang') as Language) || 'en';
      if (stored !== 'en') {
        this.currentLang.set(stored);
        document.documentElement.lang = stored;
        this.loadTranslations(stored);
      } else {
        document.documentElement.lang = 'en';
      }
    });
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    if (this.isBrowser) {
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
    }
    this.loadTranslations(lang);
  }

  private loadTranslations(lang: Language): void {
    this.http.get<Record<string, string>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => this.translations.set(data),
      error: () => this.translations.set({}),
    });
  }

  translate(key: string): string {
    const trans = this.translations();
    return trans[key] || key;
  }

  localize(obj: Record<string, unknown>, prefix: string): string {
    const lang = this.currentLang();
    const key = `${prefix}_${lang}`;
    return (obj[key] as string) || (obj[`${prefix}_en`] as string) || '';
  }
}
