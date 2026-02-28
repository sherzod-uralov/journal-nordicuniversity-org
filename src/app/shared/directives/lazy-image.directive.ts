import { Directive, ElementRef, inject, OnInit, PLATFORM_ID, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly appLazyImage = input.required<string>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      (this.el.nativeElement as HTMLImageElement).src = this.appLazyImage();
      return;
    }

    const img = this.el.nativeElement as HTMLImageElement;
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease-in';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = this.appLazyImage();
          img.onload = () => { img.style.opacity = '1'; };
          observer.unobserve(img);
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(img);
  }
}
