import { Component, input, computed, PLATFORM_ID, inject , ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

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

  readonly safeSrc = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.src())
  );
}
