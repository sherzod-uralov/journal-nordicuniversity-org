import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { environment } from '@env';

/** Widths the /_img optimizer serves (keep in sync with src/server/image-optimizer.ts). */
const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];
/** Candidates for fluid images (no fixed `width`). */
const FLUID_WIDTHS = [128, 256, 384, 640, 750, 828, 1080, 1200, 1920];
/** Fluid default: full width on phones, about half the viewport on larger screens. */
const DEFAULT_SIZES = '(max-width: 768px) 100vw, 50vw';

function clampWidth(w: number): number {
  return ALLOWED_WIDTHS.find(a => a >= w) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

/**
 * Optimized <img> that is always present in the server HTML (native lazy-loading,
 * no IntersectionObserver gating). Pass `ratio` or `width`+`height` to reserve space,
 * and `sizes`/`width` so small renditions (avatars, thumbnails) download small files.
 */
@Component({
  selector: 'app-image',
  standalone: true,
  templateUrl: './image.component.html',
  styleUrl: './image.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent {
  readonly src = input.required<string>();
  readonly alt = input('');
  readonly fit = input<'cover' | 'contain' | 'fill' | 'none'>('cover');
  /** CSS aspect-ratio, e.g. "16/9". Defaults to width/height when both are set. */
  readonly ratio = input('');
  readonly priority = input(false);
  readonly rounded = input('');
  readonly imgClass = input('');
  /** Rendered CSS width in px (fixed-size images such as avatars). */
  readonly width = input(0);
  /** Rendered CSS height in px; with `width` it reserves the aspect ratio. */
  readonly height = input(0);
  /** `sizes` attribute; defaults to `${width}px` or a fluid default. */
  readonly sizes = input('');
  readonly quality = input(75);

  readonly error = signal(false);

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
    const w = this.width() ? clampWidth(this.width()) : 828;
    return `/_img?url=${encodeURIComponent(raw)}&w=${w}&q=${this.quality()}`;
  });

  /** srcset: for a fixed width only 1x–3x renditions, otherwise the fluid ladder. */
  readonly srcSet = computed(() => {
    const raw = this.rawUrl();
    if (!raw) return '';
    const q = this.quality();
    const encoded = encodeURIComponent(raw);
    const w = this.width();
    const widths = w > 0
      ? ALLOWED_WIDTHS.filter(a => a >= clampWidth(w) && a <= clampWidth(w * 3))
      : FLUID_WIDTHS;
    return widths
      .map(cw => `/_img?url=${encoded}&w=${cw}&q=${q} ${cw}w`)
      .join(', ');
  });

  readonly sizesAttr = computed(() => {
    if (this.sizes()) return this.sizes();
    const w = this.width();
    return w > 0 ? `${w}px` : DEFAULT_SIZES;
  });

  readonly aspectRatio = computed(() => {
    if (this.ratio()) return this.ratio();
    const w = this.width();
    const h = this.height();
    return w > 0 && h > 0 ? `${w} / ${h}` : null;
  });

  onError(): void {
    this.error.set(true);
  }
}
