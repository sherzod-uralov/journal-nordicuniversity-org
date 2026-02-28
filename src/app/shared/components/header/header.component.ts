import { Component, DestroyRef, inject, signal, afterNextRender } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AuthService } from '@core/services/auth.service';
import { AuthStore } from '@store/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly authStore = inject(AuthStore);
  readonly mobileMenuOpen = signal(false);
  readonly scrolled = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  readonly navLinks = [
    { path: '/', label: 'nav.home', exact: true },
    { path: '/articles', label: 'nav.articles', exact: false },
    { path: '/volumes', label: 'nav.volumes', exact: false },
    { path: '/categories', label: 'nav.categories', exact: false },
    { path: '/guidelines', label: 'nav.guidelines', exact: false },
    { path: '/news', label: 'nav.news', exact: false },
    { path: '/about', label: 'nav.about', exact: false },
  ];

  constructor() {
    afterNextRender(() => {
      const onScroll = () => this.scrolled.set(window.scrollY > 50);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
