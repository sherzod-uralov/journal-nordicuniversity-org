import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Language, LanguageService } from '@core/services/language.service';
import { DateLocalePipe } from './date-locale.pipe';

type ProcessLike = { env: Record<string, string | undefined> };
const proc = (globalThis as unknown as { process?: ProcessLike }).process;

describe('DateLocalePipe', () => {
  const lang = signal<Language>('en');
  let pipe: DateLocalePipe;
  const originalTz = proc?.env['TZ'];

  beforeEach(() => {
    lang.set('en');
    TestBed.configureTestingModule({
      providers: [{ provide: LanguageService, useValue: { lang } }],
    });
    pipe = TestBed.runInInjectionContext(() => new DateLocalePipe());
  });

  afterEach(() => {
    if (proc) {
      if (originalTz === undefined) delete proc.env['TZ'];
      else proc.env['TZ'] = originalTz;
    }
  });

  it('formats per language', () => {
    const date = '2026-02-27T06:00:00Z';
    expect(pipe.transform(date)).toBe('Feb 27, 2026');
    expect(pipe.transform(date, 'long')).toBe('February 27, 2026');
    lang.set('ru');
    expect(pipe.transform(date)).toBe('27 фев, 2026');
    expect(pipe.transform(date, 'long')).toBe('27 февраля 2026');
    lang.set('uz');
    expect(pipe.transform(date, 'long')).toBe('27 fevral 2026');
  });

  it('returns "" for empty or invalid input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('not a date')).toBe('');
    expect(pipe.transform(new Date(NaN))).toBe('');
  });

  it('uses the Asia/Tashkent calendar day (UTC+5), not UTC', () => {
    // 20:30 UTC on Feb 26 is already 01:30 on Feb 27 in Tashkent
    expect(pipe.transform('2026-02-26T20:30:00Z')).toBe('Feb 27, 2026');
    expect(pipe.transform(new Date('2026-12-31T19:00:00Z'))).toBe('Jan 1, 2027');
    expect(pipe.transform('2026-02-26T18:59:59Z')).toBe('Feb 26, 2026');
  });

  it.runIf(!!proc)('renders the same output regardless of the process time zone', () => {
    const inputs = ['2026-02-26T20:30:00Z', '2026-02-26T18:59:59Z', '2026-12-31T19:00:00Z', '2026-06-15T00:00:00Z'];
    const outputs = new Set<string>();
    for (const tz of ['UTC', 'Asia/Tashkent', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      proc!.env['TZ'] = tz;
      outputs.add(inputs.map((i) => pipe.transform(i, 'long')).join('|'));
    }
    expect([...outputs]).toEqual(['February 27, 2026|February 26, 2026|January 1, 2027|June 15, 2026']);
  });
});
