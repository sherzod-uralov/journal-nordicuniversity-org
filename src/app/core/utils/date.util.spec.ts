import { parseLocalDate, toLocalDateString } from './date.util';

describe('date.util', () => {
  describe('toLocalDateString', () => {
    it('formats local calendar fields as YYYY-MM-DD with zero padding', () => {
      expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(toLocalDateString(new Date(1999, 11, 31))).toBe('1999-12-31');
    });

    it('never shifts the day for local midnight / late evening (unlike toISOString)', () => {
      expect(toLocalDateString(new Date(2026, 2, 1, 0, 0, 0))).toBe('2026-03-01');
      expect(toLocalDateString(new Date(2026, 2, 1, 23, 59, 59))).toBe('2026-03-01');
    });

    it('returns an empty string for null, undefined and invalid dates', () => {
      expect(toLocalDateString(null)).toBe('');
      expect(toLocalDateString(undefined)).toBe('');
      expect(toLocalDateString(new Date('not a date'))).toBe('');
    });
  });

  describe('parseLocalDate', () => {
    it('parses YYYY-MM-DD as local midnight', () => {
      const d = parseLocalDate('2026-03-01')!;
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(1);
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
    });

    it('ignores a trailing time part (uses only the date prefix)', () => {
      const d = parseLocalDate('2026-03-01T23:30:00.000Z')!;
      expect(toLocalDateString(d)).toBe('2026-03-01');
    });

    it('round-trips with toLocalDateString without a day shift', () => {
      for (const s of ['2000-01-01', '2024-02-29', '2026-12-31']) {
        expect(toLocalDateString(parseLocalDate(s))).toBe(s);
      }
    });

    it('returns null for empty or malformed input', () => {
      expect(parseLocalDate(null)).toBeNull();
      expect(parseLocalDate(undefined)).toBeNull();
      expect(parseLocalDate('')).toBeNull();
      expect(parseLocalDate('01/03/2026')).toBeNull();
      expect(parseLocalDate('2026-3-1')).toBeNull();
      expect(parseLocalDate('garbage')).toBeNull();
    });
  });
});
