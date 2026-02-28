import { Directive, ElementRef, inject, OnInit, OnDestroy, PLATFORM_ID, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  readonly appScrollAnimate = input<'fade-up' | 'fade-in' | 'slide-left' | 'slide-right'>('fade-up');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.el.nativeElement as HTMLElement;
    el.style.opacity = '0';
    el.style.transform = this.getInitialTransform();
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          this.observer?.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private getInitialTransform(): string {
    switch (this.appScrollAnimate()) {
      case 'fade-up': return 'translateY(30px)';
      case 'slide-left': return 'translateX(-30px)';
      case 'slide-right': return 'translateX(30px)';
      default: return 'none';
    }
  }
}
