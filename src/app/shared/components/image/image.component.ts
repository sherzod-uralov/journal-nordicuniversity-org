import {
  Component, input, signal, computed, ChangeDetectionStrategy,
  ElementRef, inject, AfterViewInit, OnDestroy, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env';

const BREAKPOINTS = [640, 750, 828, 1080, 1200, 1920];

@Component({
  selector: 'app-image',
  standalone: true,
  templateUrl: './image.component.html',
  styleUrl: './image.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent implements AfterViewInit, OnDestroy {
  readonly src = input.required<string>();
  readonly alt = input('');
  readonly fit = input<'cover' | 'contain' | 'fill' | 'none'>('cover');
  readonly ratio = input('');
  readonly priority = input(false);
  readonly rounded = input('');
  readonly imgClass = input('');
  readonly width = input(0);
  readonly quality = input(75);

  private readonly el = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer: IntersectionObserver | null = null;

  readonly error = signal(false);
  readonly inView = signal(false);

  private readonly rawUrl = computed(() => {
    const path = this.src();
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiUrl.replace(/\/+$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
  });

  readonly optimizedSrc = computed(() => {
    const raw = this.rawUrl();
    if (!raw) return '';
    const w = this.width() || 828;
    return `/_img?url=${encodeURIComponent(raw)}&w=${w}&q=${this.quality()}`;
  });

  /** srcset for responsive images */
  readonly srcSet = computed(() => {
    const raw = this.rawUrl();
    if (!raw) return '';
    const q = this.quality();
    const encoded = encodeURIComponent(raw);
    return BREAKPOINTS
      .map(w => `/_img?url=${encoded}&w=${w}&q=${q} ${w}w`)
      .join(', ');
  });

  /** sizes attribute */
  readonly sizes = computed(() => {
    const w = this.width();
    if (w > 0) return `${w}px`;
    return '100vw';
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

  onError(): void {
    this.error.set(true);
  }
}
