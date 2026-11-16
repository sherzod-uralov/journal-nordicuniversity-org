import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(text: string, query: string): SafeHtml {
    if (!query?.trim() || !text) {
      return text;
    }
    // Match on the RAW text (so "&" or "<" in a title can't split an entity like "&amp;"),
    // then HTML-escape every segment. Only our own <mark> tags end up as real HTML.
    const regexEscaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${regexEscaped})`, 'gi');
    const highlighted = text
      .split(regex)
      .map((segment, i) => i % 2 === 1
        ? `<mark class="search-highlight bg-dusk/10 text-dusk font-semibold rounded-sm px-0.5">${escapeHtml(segment)}</mark>`
        : escapeHtml(segment))
      .join('');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
