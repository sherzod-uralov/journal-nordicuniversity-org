import { Directive, ElementRef, inject, OnInit, OnDestroy, PLATFORM_ID, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

let sharedObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, () => void>();

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const callback = observedElements.get(entry.target);
            if (callback) {
              callback();
              sharedObserver!.unobserve(entry.target);
              observedElements.delete(entry.target);
            }
          }
        }
        if (observedElements.size === 0) {
          sharedObserver!.disconnect();
          sharedObserver = null;
        }
      },
      { threshold: 0.1 },
    );
  }
  return sharedObserver;
}

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly appScrollAnimate = input<'fade-up' | 'fade-in' | 'slide-left' | 'slide-right'>('fade-up');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.el.nativeElement as HTMLElement;
    el.style.opacity = '0';
    el.style.transform = this.getInitialTransform();
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

    observedElements.set(el, () => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    getSharedObserver().observe(el);
  }

  ngOnDestroy(): void {
    const el = this.el.nativeElement as HTMLElement;
    observedElements.delete(el);
    sharedObserver?.unobserve(el);
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
