import { Injectable, signal, computed, inject, PLATFORM_ID, TransferState, makeStateKey, REQUEST } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export type Language = 'uz' | 'ru' | 'en';

const VALID_LANGS: Language[] = ['uz', 'ru', 'en'];
const TRANSLATIONS_KEY = makeStateKey<Record<string, string>>('app-translations');

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly isServer = isPlatformServer(this.platformId);

  private readonly currentLang = signal<Language>('en');
  private readonly translations = signal<Record<string, string>>({});

  readonly language = this.currentLang.asReadonly();
  readonly lang = computed(() => this.currentLang());

  constructor() {
    // Determine initial language from cookie (server) or localStorage (client)
    let initialLang: Language = 'en';

    if (this.isServer) {
      const req = inject(REQUEST, { optional: true }) as Request | null;
      if (req) {
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/(?:^|;\s*)lang=(uz|ru|en)/);
        if (match) initialLang = match[1] as Language;
      }
    } else {
      try {
        const stored = localStorage.getItem('lang') as Language;
        if (stored && VALID_LANGS.includes(stored)) initialLang = stored;
      } catch { /* SSR safety */ }
    }

    this.currentLang.set(initialLang);
    this.doc.documentElement.lang = initialLang;

    // Client: use server-transferred translations immediately (no flicker)
    if (this.isBrowser) {
      const cached = this.transferState.get(TRANSLATIONS_KEY, null!);
      if (cached) {
        this.translations.set(cached);
        this.transferState.remove(TRANSLATIONS_KEY);
        return;
      }
    }

    this.loadTranslations(initialLang);
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    if (this.isBrowser) {
      localStorage.setItem('lang', lang);
      document.cookie = `lang=${lang};path=/;max-age=31536000;SameSite=Lax`;
      this.doc.documentElement.lang = lang;
    }
    this.loadTranslations(lang);
  }

  private loadTranslations(lang: Language): void {
    this.http.get<Record<string, string>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.translations.set(data);
        // Server: save translations to TransferState for client
        if (this.isServer) {
          this.transferState.set(TRANSLATIONS_KEY, data);
        }
      },
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
