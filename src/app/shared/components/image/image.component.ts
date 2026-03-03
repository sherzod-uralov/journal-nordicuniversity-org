import {
  Component, input, signal, computed, ChangeDetectionStrategy,
  ElementRef, inject, AfterViewInit, OnDestroy, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env';

@Component({
  selector: 'app-image',
  standalone: true,
  templateUrl: './image.component.html',
  styleUrl: './image.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent implements AfterViewInit, OnDestroy {
  /** Image path — raw API path or full URL */
  readonly src = input.required<string>();
  readonly alt = input('');
  /** CSS object-fit */
  readonly fit = input<'cover' | 'contain' | 'fill' | 'none'>('cover');
  /** Aspect ratio string e.g. '16/9', '4/3', '1/1'. If empty, fills parent. */
  readonly ratio = input('');
  /** Mark as LCP / above-fold image — disables lazy loading, sets fetchpriority high */
  readonly priority = input(false);
  /** Border radius token */
  readonly rounded = input('');
  /** Extra CSS class on the <img> */
  readonly imgClass = input('');

  private readonly el = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer: IntersectionObserver | null = null;

  readonly loaded = signal(false);
  readonly error = signal(false);
  readonly inView = signal(false);

  readonly resolvedSrc = computed(() => {
    const path = this.src();
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiUrl.replace(/\/+$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
  });

  readonly shouldLoad = computed(() => this.priority() || this.inView());

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    if (this.priority()) {
      this.inView.set(true);
      return;
    }
    const el = this.el.nativeElement as HTMLElement;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.inView.set(true);
          this.observer?.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onLoad(): void {
    this.loaded.set(true);
  }

  onError(): void {
    this.error.set(true);
    this.loaded.set(true);
  }
}
