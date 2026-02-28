import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@store/auth.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-cabinet-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './cabinet-layout.component.html',
  styleUrl: './cabinet-layout.component.css',
})
export class CabinetLayoutComponent {
  readonly authStore = inject(AuthStore);

  readonly sidebarLinks = [
    { path: '/cabinet/dashboard', label: 'cabinet.sidebar.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/cabinet/articles', label: 'cabinet.sidebar.articles', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/cabinet/articles/new', label: 'cabinet.sidebar.submit', icon: 'M12 4v16m8-8H4' },
    { path: '/cabinet/profile', label: 'cabinet.sidebar.profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];
}
