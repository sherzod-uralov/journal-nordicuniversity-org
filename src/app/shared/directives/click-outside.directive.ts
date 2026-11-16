import { Directive, ElementRef, inject, output, input, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

/**
 * Emits when a click lands outside the host element.
 * The document listener is attached only while `appClickOutsideEnabled` is true
 * (bind it to the dropdown's open state), so closed instances cost nothing.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private readonly el = inject(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly appClickOutside = output<void>();
  readonly appClickOutsideEnabled = input(true);

  private readonly handler = (event: MouseEvent) => {
    if (!this.el.nativeElement.contains(event.target)) {
      this.appClickOutside.emit();
    }
  };

  constructor() {
    effect((onCleanup) => {
      if (!this.isBrowser || !this.appClickOutsideEnabled()) return;
      this.doc.addEventListener('click', this.handler, true);
      onCleanup(() => this.doc.removeEventListener('click', this.handler, true));
    });
  }
}
