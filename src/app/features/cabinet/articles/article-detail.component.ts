import { Component, inject, OnInit, signal, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleApiService } from '@services/api/article-api.service';
import { FileApiService } from '@services/api/file-api.service';
import { Article, ArticleStatus } from '@core/models/article.model';
import { ArticleStatusBadgeComponent } from '@shared/components/article-status-badge/article-status-badge.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { DecimalPipe } from '@angular/common';

interface StatusStep {
  key: ArticleStatus;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, ArticleStatusBadgeComponent, TranslatePipe, DateLocalePipe, DecimalPipe],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css',
})
export class ArticleDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly articleApi = inject(ArticleApiService);
  private readonly fileApi = inject(FileApiService);

  readonly article = signal<Article | null>(null);
  readonly loading = signal(true);

  readonly steps: StatusStep[] = [
    { key: 'NEW', labelKey: 'cabinet.articles.step_new', icon: 'pi-send' },
    { key: 'PLAGIARISM', labelKey: 'cabinet.articles.step_plagiarism', icon: 'pi-shield' },
    { key: 'REVIEW', labelKey: 'cabinet.articles.step_review', icon: 'pi-file-edit' },
    { key: 'PAYMENT', labelKey: 'cabinet.articles.step_payment', icon: 'pi-credit-card' },
    { key: 'ACCEPT', labelKey: 'cabinet.articles.step_accept', icon: 'pi-check-circle' },
  ];

  readonly statusOrder: ArticleStatus[] = ['NEW', 'PLAGIARISM', 'REVIEW', 'PAYMENT', 'ACCEPT'];

  readonly currentStepIndex = computed(() => {
    const a = this.article();
    if (!a) return -1;
    if (a.status === 'REJECTED') {
      return this.statusOrder.indexOf(a.last_status);
    }
    return this.statusOrder.indexOf(a.status);
  });

  readonly isRejected = computed(() => this.article()?.status === 'REJECTED');

  ngOnInit(): void {
    this.articleApi.getUserArticleById(this.id()).subscribe({
      next: (article) => {
        this.article.set(article);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStepState(index: number): 'completed' | 'current' | 'rejected' | 'pending' {
    const current = this.currentStepIndex();
    if (this.isRejected() && index === current) return 'rejected';
    if (index < current) return 'completed';
    if (index === current) return 'current';
    return 'pending';
  }

  getFileUrl(path: string): string {
    return this.fileApi.getFileUrl(path);
  }

  payWithClick(): void {
    const link = this.article()?.transaction?.transactions_link?.click_link;
    if (link) window.open(link, '_blank');
  }

  payWithPayme(): void {
    const link = this.article()?.transaction?.transactions_link?.payme_link;
    if (link) window.open(link, '_blank');
  }
}
