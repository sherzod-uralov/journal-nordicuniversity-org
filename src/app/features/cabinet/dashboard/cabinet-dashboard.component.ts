import { Component, inject, OnInit, effect, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabinetStore } from '@store/cabinet.store';
import { AuthStore } from '@store/auth.store';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { ArticleStatusBadgeComponent } from '@shared/components/article-status-badge/article-status-badge.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';

@Component({
  selector: 'app-cabinet-dashboard',
  standalone: true,
  imports: [RouterLink, StatCardComponent, ArticleStatusBadgeComponent, TranslatePipe, DateLocalePipe],
  templateUrl: './cabinet-dashboard.component.html',
  styleUrl: './cabinet-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinetDashboardComponent implements OnInit {
  readonly cabinetStore = inject(CabinetStore);
  readonly authStore = inject(AuthStore);
  readonly recentArticles = computed(() => this.cabinetStore.myArticles().slice(0, 5));
  private articlesLoaded = false;

  private readonly profileEffect = effect(() => {
    const p = this.authStore.profile();
    if (p && !this.articlesLoaded) {
      this.articlesLoaded = true;
      this.cabinetStore.loadMyArticles(p.id);
    }
  });

  ngOnInit(): void {
    if (!this.authStore.profile()) {
      this.authStore.loadProfile();
    }
  }
}
