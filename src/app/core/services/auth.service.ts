import { Injectable, signal, computed, PLATFORM_ID, inject, REQUEST } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly tokenSignal = signal<string | null>(this.loadToken());
  private readonly loggedInHint = signal(this.loadLoggedInHint());

  readonly isAuthenticated = computed(() => {
    // Browser: real token check; Server: cookie hint
    if (this.isBrowser) return !!this.tokenSignal();
    return this.loggedInHint();
  });

  readonly token = computed(() => this.tokenSignal());

  private loadToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private loadLoggedInHint(): boolean {
    if (isPlatformServer(this.platformId)) {
      try {
        const req = inject(REQUEST, { optional: true }) as Request | null;
        if (req) {
          const cookieHeader = req.headers.get('cookie') || '';
          return /(?:^|;\s*)logged_in=1/.test(cookieHeader);
        }
      } catch { /* noop */ }
    }
    return false;
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string): void {
    this.tokenSignal.set(token);
    if (this.isBrowser) {
      localStorage.setItem('access_token', token);
      this.doc.cookie = 'logged_in=1;path=/;max-age=31536000;SameSite=Lax';
    }
  }

  logout(): void {
    this.tokenSignal.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      this.doc.cookie = 'logged_in=;path=/;max-age=0;SameSite=Lax';
    }
  }
}
