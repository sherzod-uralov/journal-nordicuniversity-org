import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabinetStore } from '@store/cabinet.store';
import { AuthStore } from '@store/auth.store';
import { ArticleStatusBadgeComponent } from '@shared/components/article-status-badge/article-status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [RouterLink, ArticleStatusBadgeComponent, EmptyStateComponent, TranslatePipe, DateLocalePipe],
  templateUrl: './my-articles.component.html',
  styleUrl: './my-articles.component.css',
})
export class MyArticlesComponent implements OnInit {
  readonly cabinetStore = inject(CabinetStore);
  private readonly authStore = inject(AuthStore);
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
