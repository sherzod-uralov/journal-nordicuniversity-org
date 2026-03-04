import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(text: string, query: string): SafeHtml {
    if (!query?.trim() || !text) {
      return text;
    }
    // HTML-escape both text and query BEFORE regex replacement to prevent XSS.
    // Only the <mark> tags we add ourselves will be actual HTML in the output.
    const escapeHtml = (s: string) =>
      s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

    const safeText = escapeHtml(text);
    const safeQuery = escapeHtml(query);
    const regexEscaped = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${regexEscaped})`, 'gi');
    const highlighted = safeText.replace(
      regex,
      '<mark class="search-highlight bg-dusk/10 text-dusk font-semibold rounded-sm px-0.5">$1</mark>',
    );
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
