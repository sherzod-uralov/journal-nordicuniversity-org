import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LanguageService } from './language.service';

/** Node 26 leaves `localStorage` undefined in the jsdom test env, so the spec stubs one. */
class MemoryStorage {
  private readonly items = new Map<string, string>();
  get length() { return this.items.size; }
  key(i: number) { return [...this.items.keys()][i] ?? null; }
  getItem(k: string) { return this.items.get(k) ?? null; }
  setItem(k: string, v: string) { this.items.set(k, String(v)); }
  removeItem(k: string) { this.items.delete(k); }
  clear() { this.items.clear(); }
}

function clearLangCookie(): void {
  document.cookie = 'lang=; max-age=0; path=/';
}

describe('LanguageService (browser)', () => {
  let http: HttpTestingController;

  function create(): LanguageService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(LanguageService);
  }

  let storage: MemoryStorage;

  beforeEach(() => {
    clearLangCookie();
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    http?.verify();
    vi.unstubAllGlobals();
    clearLangCookie();
  });

  it('defaults to "en" without cookie or storage', () => {
    const service = create();
    expect(service.language()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    http.expectOne('/i18n/en.json?v=2').flush({});
  });

  it('uses localStorage when there is no cookie', () => {
    localStorage.setItem('lang', 'ru');
    const service = create();
    expect(service.language()).toBe('ru');
    http.expectOne('/i18n/ru.json?v=2').flush({});
  });

  it('prefers the cookie over localStorage (matches what SSR rendered)', () => {
    localStorage.setItem('lang', 'ru');
    document.cookie = 'lang=uz; path=/';
    const service = create();
    expect(service.language()).toBe('uz');
    http.expectOne('/i18n/uz.json?v=2').flush({});
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('lang', 'de');
    const service = create();
    expect(service.language()).toBe('en');
    http.expectOne('/i18n/en.json?v=2').flush({});
  });

  it('persists the resolved language to cookie and storage', () => {
    localStorage.setItem('lang', 'ru');
    create();
    expect(document.cookie).toContain('lang=ru');
    expect(localStorage.getItem('lang')).toBe('ru');
    http.expectOne('/i18n/ru.json?v=2').flush({});
  });

  it('falls back to default when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('blocked', 'SecurityError'); },
      setItem: () => { throw new DOMException('blocked', 'SecurityError'); },
    });
    const service = create();
    expect(service.language()).toBe('en');
    http.expectOne('/i18n/en.json?v=2').flush({});
  });

  it('setLanguage switches language, persists it and loads translations', () => {
    const service = create();
    http.expectOne('/i18n/en.json?v=2').flush({ hello: 'Hello' });
    expect(service.translate('hello')).toBe('Hello');

    service.setLanguage('ru');
    expect(service.language()).toBe('ru');
    expect(localStorage.getItem('lang')).toBe('ru');
    expect(document.cookie).toContain('lang=ru');
    http.expectOne('/i18n/ru.json?v=2').flush({ hello: 'Привет' });
    expect(service.translate('hello')).toBe('Привет');
    expect(service.translate('missing.key')).toBe('missing.key');
  });
});
