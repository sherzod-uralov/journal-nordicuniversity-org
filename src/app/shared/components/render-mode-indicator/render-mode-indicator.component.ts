import { Component, isDevMode, inject, signal, computed, DestroyRef, PLATFORM_ID , ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

interface RouteRule {
  pattern: string;
  mode: 'SSR' | 'CSR' | 'SSG';
}

@Component({
  selector: 'app-render-mode-indicator',
  standalone: true,
  template: `
    @if (visible) {
      <!-- Badge -->
      <button class="rmi-badge" [class]="'rmi-badge rmi-badge--' + renderMode().toLowerCase()" (click)="togglePanel()">
        <span class="rmi-dot"></span>
        <span>{{ renderMode() }}</span>
      </button>

      <!-- Panel -->
      @if (panelOpen()) {
        <div class="rmi-panel">
          <div class="rmi-panel-header">
            <span class="rmi-panel-title">Render Info</span>
            <button class="rmi-panel-close" (click)="togglePanel()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="rmi-panel-body">
            <!-- Render Mode -->
            <div class="rmi-row">
              <span class="rmi-label">Render Mode</span>
              <span class="rmi-value">
                <span class="rmi-tag" [class]="'rmi-tag--' + renderMode().toLowerCase()">{{ renderMode() }}</span>
                <span class="rmi-mode-desc">{{ modeDescription() }}</span>
              </span>
            </div>

            <!-- Route -->
            <div class="rmi-row">
              <span class="rmi-label">Route</span>
              <span class="rmi-value rmi-mono">{{ currentPath() }}</span>
            </div>

            <!-- Hydration -->
            <div class="rmi-row">
              <span class="rmi-label">Hydration</span>
              <span class="rmi-value">
                @if (renderMode() === 'SSR') {
                  <span class="rmi-tag rmi-tag--active">Transfer State + Event Replay</span>
                } @else {
                  <span class="rmi-tag rmi-tag--off">N/A (Client-only)</span>
                }
              </span>
            </div>

            <!-- HTTP Cache -->
            <div class="rmi-row">
              <span class="rmi-label">HTTP Transfer</span>
              <span class="rmi-value">
                @if (renderMode() === 'SSR') {
                  <span class="rmi-tag rmi-tag--active">Cached (incl. POST)</span>
                } @else {
                  <span class="rmi-tag rmi-tag--off">Disabled</span>
                }
              </span>
            </div>

            <!-- Server Cache -->
            <div class="rmi-row">
              <span class="rmi-label">ISR Cache</span>
              <span class="rmi-value">
                @if (renderMode() === 'SSR') {
                  <span class="rmi-tag rmi-tag--active">60s SWR</span>
                } @else {
                  <span class="rmi-tag rmi-tag--off">N/A</span>
                }
              </span>
            </div>

            <!-- Preloading -->
            <div class="rmi-row">
              <span class="rmi-label">Preloading</span>
              <span class="rmi-value">
                <span class="rmi-tag rmi-tag--active">All Modules</span>
              </span>
            </div>

            <!-- Compression -->
            <div class="rmi-row">
              <span class="rmi-label">Compression</span>
              <span class="rmi-value">
                <span class="rmi-tag rmi-tag--active">gzip</span>
              </span>
            </div>
          </div>

          <div class="rmi-panel-footer">
            dev mode only — hidden in production
          </div>
        </div>
      }
    }
  `,
  styles: `
    /* ── Badge ── */
    .rmi-badge {
      position: fixed;
      bottom: 0.75rem;
      left: 0.75rem;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3125rem 0.625rem;
      border: none;
      border-radius: 0.375rem;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      line-height: 1;
      cursor: pointer;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .rmi-badge:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .rmi-badge--ssr { background: rgba(16, 185, 129, 0.9); color: white; }
    .rmi-badge--csr { background: rgba(139, 92, 246, 0.9); color: white; }
    .rmi-badge--ssg { background: rgba(59, 130, 246, 0.9); color: white; }

    .rmi-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.6;
    }

    /* ── Panel ── */
    .rmi-panel {
      position: fixed;
      bottom: 2.75rem;
      left: 0.75rem;
      z-index: 9999;
      width: 20rem;
      background: rgba(13, 27, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.75rem;
      box-shadow: 0 16px 48px rgba(0,0,0,0.4);
      color: white;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.75rem;
      animation: rmi-slide-up 0.2s ease-out;
      overflow: hidden;
    }

    @keyframes rmi-slide-up {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .rmi-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0.875rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .rmi-panel-title {
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.7;
    }

    .rmi-panel-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      cursor: pointer;
      padding: 0.125rem;
      border-radius: 0.25rem;
      display: flex;
      transition: color 0.15s, background 0.15s;
    }
    .rmi-panel-close:hover {
      color: white;
      background: rgba(255,255,255,0.1);
    }

    .rmi-panel-body {
      padding: 0.5rem 0;
    }

    .rmi-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
    }

    .rmi-label {
      color: rgba(255,255,255,0.45);
      font-size: 0.6875rem;
      white-space: nowrap;
      padding-top: 0.125rem;
    }

    .rmi-value {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.375rem;
      text-align: right;
      justify-content: flex-end;
    }

    .rmi-mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6875rem;
      color: rgba(255,255,255,0.8);
    }

    .rmi-mode-desc {
      font-size: 0.625rem;
      color: rgba(255,255,255,0.4);
    }

    /* ── Tags ── */
    .rmi-tag {
      display: inline-block;
      padding: 0.125rem 0.4375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .rmi-tag--ssr { background: rgba(16,185,129,0.2); color: #6ee7b7; }
    .rmi-tag--csr { background: rgba(139,92,246,0.2); color: #c4b5fd; }
    .rmi-tag--ssg { background: rgba(59,130,246,0.2); color: #93c5fd; }
    .rmi-tag--active { background: rgba(16,185,129,0.15); color: #6ee7b7; }
    .rmi-tag--off { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }

    .rmi-panel-footer {
      padding: 0.5rem 0.875rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 0.5625rem;
      color: rgba(255,255,255,0.25);
      text-align: center;
      font-style: italic;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenderModeIndicatorComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly visible = isDevMode() && isPlatformBrowser(this.platformId);
  readonly renderMode = signal<'SSR' | 'CSR' | 'SSG'>('SSR');
  readonly currentPath = signal('/');
  readonly panelOpen = signal(false);

  readonly modeDescription = computed(() => {
    switch (this.renderMode()) {
      case 'SSR': return 'Server-Side Rendered';
      case 'CSR': return 'Client-Side Rendered';
      case 'SSG': return 'Static Site Generated';
    }
  });

  private readonly rules: RouteRule[] = [
    { pattern: 'auth', mode: 'CSR' },
    { pattern: 'cabinet', mode: 'CSR' },
    { pattern: 'guidelines', mode: 'CSR' },
  ];

  private readonly defaultMode: 'SSR' | 'CSR' | 'SSG' = 'SSR';

  constructor() {
    if (!this.visible) return;

    this.updateMode(this.router.url);

    const sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateMode(e.urlAfterRedirects));

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  togglePanel(): void {
    this.panelOpen.update(v => !v);
  }

  private updateMode(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.currentPath.set(path);

    const segments = path.replace(/^\//, '').split('/');
    const firstSegment = segments[0] || '';

    const matched = this.rules.find((r) => firstSegment === r.pattern);
    this.renderMode.set(matched ? matched.mode : this.defaultMode);

    // Close panel on navigation
    this.panelOpen.set(false);
  }
}
