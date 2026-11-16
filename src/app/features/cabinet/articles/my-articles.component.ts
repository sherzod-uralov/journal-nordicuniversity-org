import { Component, inject, OnInit, effect, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabinetStore } from '@store/cabinet.store';
import { AuthStore } from '@store/auth.store';
import { ArticleStatusBadgeComponent } from '@shared/components/article-status-badge/article-status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [RouterLink, ArticleStatusBadgeComponent, EmptyStateComponent, ErrorStateComponent, TranslatePipe, DateLocalePipe],
  templateUrl: './my-articles.component.html',
  styleUrl: './my-articles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyArticlesComponent implements OnInit {
  readonly cabinetStore = inject(CabinetStore);
  private readonly authStore = inject(AuthStore);
  private articlesLoaded = false;

  /** Articles (or the profile they depend on) failed to load. */
  readonly loadFailed = computed(() =>
    !!this.cabinetStore.error() || (!this.authStore.profile() && this.authStore.profileLoadFailed())
  );
  /** Skeleton while articles load, including the wait for the profile. */
  readonly showSkeleton = computed(() =>
    this.cabinetStore.loading() || (!this.authStore.profile() && !this.authStore.profileLoadFailed())
  );

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

  retry(): void {
    const p = this.authStore.profile();
    if (p) {
      this.cabinetStore.loadMyArticles(p.id);
    } else {
      this.authStore.loadProfile();
    }
  }
}
