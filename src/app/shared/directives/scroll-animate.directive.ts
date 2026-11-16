import { Directive, ElementRef, inject, OnDestroy, PLATFORM_ID, input, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Elements starting within this distance below the fold count as visible and are never hidden. */
const NEAR_VIEWPORT_PX = 80;

/** One IntersectionObserver shared by every instance. */
let sharedObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, () => void>();

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const reveal = observedElements.get(entry.target);
          if (reveal) reveal();
          unobserve(entry.target);
        }
      },
      // threshold 0: tall elements (e.g. an article body) must still trigger.
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    );
  }
  return sharedObserver;
}

function unobserve(el: Element): void {
  observedElements.delete(el);
  sharedObserver?.unobserve(el);
  if (sharedObserver && observedElements.size === 0) {
    sharedObserver.disconnect();
    sharedObserver = null;
  }
}

/**
 * Fades/slides an element in when it scrolls into view.
 * SSR-safe: server HTML is untouched, and on the client only elements that start
 * below the fold are hidden — content already on screen never flashes out
 * (protects LCP and hydration). Disabled entirely for prefers-reduced-motion.
 */
@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly appScrollAnimate = input<'fade-up' | 'fade-in' | 'slide-left' | 'slide-right'>('fade-up');

  constructor() {
    if (!this.isBrowser) return;
    // Measure after the DOM is rendered (and hydrated) — never in ngOnInit.
    afterNextRender({ read: () => this.setup() });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    unobserve(this.el.nativeElement as Element);
  }

  private setup(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const el = this.el.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    // Already in/near the viewport (or scrolled past): leave it fully visible.
    if (rect.top < window.innerHeight + NEAR_VIEWPORT_PX) return;

    el.style.opacity = '0';
    el.style.transform = this.getInitialTransform();
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

    observedElements.set(el, () => {
      el.style.opacity = '';
      el.style.transform = '';
    });
    getSharedObserver().observe(el);
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
