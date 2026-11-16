import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new HighlightPipe(sanitizer);
  });

  /** Unwraps the trusted value back to the HTML string the template would render. */
  const html = (value: SafeHtml | string) => sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  const render = (value: SafeHtml | string) => {
    const div = document.createElement('div');
    div.innerHTML = html(value);
    return div;
  };
  const marks = (value: SafeHtml | string) => [...render(value).querySelectorAll('mark')].map((m) => m.textContent);

  it('returns the text untouched for an empty / blank query or empty text', () => {
    expect(pipe.transform('Hello', '')).toBe('Hello');
    expect(pipe.transform('Hello', '   ')).toBe('Hello');
    expect(pipe.transform('', 'x')).toBe('');
  });

  it('wraps every case-insensitive match in <mark>', () => {
    const out = pipe.transform('Data and data', 'data');
    expect(marks(out)).toEqual(['Data', 'data']);
    expect(render(out).textContent).toBe('Data and data');
  });

  it('escapes HTML in both matched and unmatched segments', () => {
    const out = html(pipe.transform('a < b & "c"', 'b'));
    expect(out).toContain('a &lt; ');
    expect(out).toContain('&amp;');
    expect(out).not.toContain('<b');
  });

  it('query "amp" does not break entities produced by escaping', () => {
    const out = pipe.transform('Tom & Jerry', 'amp');
    expect(marks(out)).toEqual([]);
    expect(render(out).textContent).toBe('Tom & Jerry');
    expect(html(out)).toBe('Tom &amp; Jerry');
  });

  it('query "&" highlights the raw ampersand as an escaped entity', () => {
    const out = pipe.transform('R&D and Q&A', '&');
    expect(marks(out)).toEqual(['&', '&']);
    expect(render(out).textContent).toBe('R&D and Q&A');
  });

  it('keeps XSS payloads escaped (as text, never elements)', () => {
    const payload = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    for (const query of ['img', 'script', 'onerror', '<', 'alert']) {
      const dom = render(pipe.transform(payload, query));
      expect(dom.querySelector('img, script')).toBeNull();
      expect([...dom.children].every((el) => el.tagName === 'MARK')).toBe(true);
      expect(dom.textContent).toBe(payload);
    }
  });

  it('escapes the query inside the <mark> too', () => {
    const dom = render(pipe.transform('x <b>bold</b> y', '<b>'));
    expect(dom.querySelector('b')).toBeNull();
    expect(marks(pipe.transform('x <b>bold</b> y', '<b>'))).toEqual(['<b>']);
  });

  it('treats regex special characters in the query literally', () => {
    expect(() => pipe.transform('a (b+ c', '(b+')).not.toThrow();
    expect(marks(pipe.transform('a (b+ c', '(b+'))).toEqual(['(b+']);
    expect(marks(pipe.transform('a.b axb', '.'))).toEqual(['.']);
  });
});
