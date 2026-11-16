import { Component, input, computed, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** Only http(s) URLs (absolute or relative) may be embedded; anything else is rejected. */
function toHttpUrl(src: string | null | undefined): string | null {
  const value = (src ?? '').trim();
  if (!value) return null;
  try {
    const { protocol } = new URL(value, 'https://placeholder.invalid/');
    return protocol === 'https:' || protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewerComponent {
  readonly src = input.required<string>();
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sanitizer = inject(DomSanitizer);

  /** Validated URL, or null when the API sent something that isn't http(s). */
  readonly url = computed(() => toHttpUrl(this.src()));

  readonly safeSrc = computed<SafeResourceUrl | null>(() => {
    const url = this.url();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
}
