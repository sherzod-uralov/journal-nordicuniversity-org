import { Injectable, signal, computed, inject, PLATFORM_ID, TransferState, makeStateKey, REQUEST } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, timeout } from 'rxjs';
import { safeStorage } from '@core/utils/safe-storage.util';

export type Language = 'uz' | 'ru' | 'en';

type Translations = Record<string, string>;

const VALID_LANGS: Language[] = ['uz', 'ru', 'en'];
const DEFAULT_LANG: Language = 'en';
const LANG_KEY = 'lang';
const LANG_COOKIE_MAX_AGE = 31536000; // 1 year
const LANG_COOKIE_PATTERN = /(?:^|;\s*)lang=(uz|ru|en)(?:;|$)/;
const SERVER_TRANSLATIONS_TIMEOUT_MS = 5000;
/**
 * Cache-busting version for /i18n/*.json. Before 2026-11 these files were served
 * `immutable` for a year, so returning browsers would never refetch the old URL.
 * They are now served `no-cache`, so this only needs a bump if that ever changes.
 */
const I18N_VERSION = '2';
const TRANSLATIONS_KEY = makeStateKey<{ lang: Language; data: Translations }>('app-translations');

/**
 * Server only: translations per language, shared by all renders in this process,
 * so SSR doesn't fetch /i18n/xx.json over the network on every request.
 */
const serverTranslationCache = new Map<Language, Translations>();

function isLanguage(value: unknown): value is Language {
  return VALID_LANGS.includes(value as Language);
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly isServer = isPlatformServer(this.platformId);

  private readonly currentLang = signal<Language>(DEFAULT_LANG);
  private readonly translations = signal<Translations>({});
  private translationSub?: Subscription;

  readonly language = this.currentLang.asReadonly();
  readonly lang = computed(() => this.currentLang());

  constructor() {
    // Server: `lang` cookie. Browser: cookie → localStorage → default (the cookie wins so
    // the browser agrees with what the server rendered whenever the cookie exists).
    const initialLang = this.isServer ? this.readRequestLang() : this.readBrowserLang();

    this.currentLang.set(initialLang);
    this.doc.documentElement.lang = initialLang;

    if (this.isBrowser) {
      // Re-write cookie + storage so the next SSR request renders the same language.
      this.persistLang(initialLang);

      // Use server-transferred translations immediately (no flicker). If the server
      // rendered another language (e.g. cookie expired), still load the right file.
      const transferred = this.transferState.get(TRANSLATIONS_KEY, null);
      this.transferState.remove(TRANSLATIONS_KEY);
      if (transferred?.data) {
        this.translations.set(transferred.data);
        if (transferred.lang === initialLang) return;
      }
    }

    this.loadTranslations(initialLang);
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    this.doc.documentElement.lang = lang;
    if (this.isBrowser) {
      this.persistLang(lang);
    }
    this.loadTranslations(lang);
  }

  private readRequestLang(): Language {
    const req = inject(REQUEST, { optional: true }) as Request | null;
    const match = (req?.headers.get('cookie') || '').match(LANG_COOKIE_PATTERN);
    return match ? (match[1] as Language) : DEFAULT_LANG;
  }

  private readBrowserLang(): Language {
    let cookie = '';
    try {
      cookie = this.doc.cookie || '';
    } catch { /* cookies blocked */ }
    const match = cookie.match(LANG_COOKIE_PATTERN);
    if (match) return match[1] as Language;

    const stored = safeStorage.get(LANG_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANG;
  }

  private persistLang(lang: Language): void {
    safeStorage.set(LANG_KEY, lang);
    try {
      this.doc.cookie = `${LANG_KEY}=${lang};path=/;max-age=${LANG_COOKIE_MAX_AGE};SameSite=Lax`;
    } catch { /* cookies blocked */ }
  }

  private loadTranslations(lang: Language): void {
    this.translationSub?.unsubscribe();

    if (this.isServer) {
      const cached = serverTranslationCache.get(lang);
      if (cached) {
        this.applyTranslations(lang, cached);
        return;
      }
    }

    // Translations are transferred explicitly (with their language), so keep them
    // out of the HTTP transfer cache to avoid embedding the JSON twice in the HTML.
    let request$: Observable<Translations> = this.http.get<Translations>(`/i18n/${lang}.json?v=${I18N_VERSION}`, { transferCache: false });
    if (this.isServer) {
      request$ = request$.pipe(timeout(SERVER_TRANSLATIONS_TIMEOUT_MS));
    }

    this.translationSub = request$.subscribe({
      next: (data) => {
        if (this.isServer) {
          serverTranslationCache.set(lang, data);
        }
        this.applyTranslations(lang, data);
      },
      error: () => this.translations.set({}),
    });
  }

  private applyTranslations(lang: Language, data: Translations): void {
    this.translations.set(data);
    if (this.isServer) {
      this.transferState.set(TRANSLATIONS_KEY, { lang, data });
    }
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
