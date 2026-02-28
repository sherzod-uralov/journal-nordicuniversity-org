import { Component, input, computed } from '@angular/core';
import { ArticleStatus } from '@core/models/article.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-article-status-badge',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './article-status-badge.component.html',
  styleUrl: './article-status-badge.component.css',
})
export class ArticleStatusBadgeComponent {
  readonly status = input.required<ArticleStatus>();

  readonly badgeClass = computed(() => {
    const map: Record<ArticleStatus, string> = {
      NEW: 'badge-info',
      PLAGIARISM: 'badge-warn',
      REVIEW: 'badge-warn',
      PAYMENT: 'badge-payment',
      ACCEPT: 'badge-success',
      REJECTED: 'badge-danger',
    };
    return map[this.status()] || 'badge-info';
  });

  readonly icon = computed(() => {
    const map: Record<ArticleStatus, string> = {
      NEW: 'pi-sparkles',
      PLAGIARISM: 'pi-shield',
      REVIEW: 'pi-file-edit',
      PAYMENT: 'pi-credit-card',
      ACCEPT: 'pi-check-circle',
      REJECTED: 'pi-times-circle',
    };
    return map[this.status()] || 'pi-info-circle';
  });
}
