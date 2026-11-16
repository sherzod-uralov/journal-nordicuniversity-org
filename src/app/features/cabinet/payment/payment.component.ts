import { Component, inject, OnInit, input, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BillingApiService } from '@services/api/billing-api.service';
import { ArticleApiService } from '@services/api/article-api.service';
import { ToastService } from '@core/services/toast.service';
import { Article } from '@core/models/article.model';
import { Transaction } from '@core/models/transaction.model';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe, ErrorStateComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent implements OnInit {
  readonly articleId = input.required<string>();
  private readonly billingApi = inject(BillingApiService);
  private readonly articleApi = inject(ArticleApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly article = signal<Article | null>(null);
  /** Transaction created on this page by an explicit user action. */
  readonly transaction = signal<Transaction | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly creating = signal(false);

  /**
   * What to pay: a transaction created here, or the pending one the API already attached
   * to the article. Visiting/refreshing the page never creates a new transaction.
   */
  readonly payment = computed(() => {
    const t = this.transaction();
    if (t?.transactions_link) return { amount: t.amount, links: t.transactions_link };
    const existing = this.article()?.transaction;
    if (existing?.transactions_link) return { amount: existing.amount, links: existing.transactions_link };
    return null;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.articleApi.getUserArticleById(this.articleId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (a) => { this.article.set(a); this.loading.set(false); },
      error: () => { this.loading.set(false); this.loadError.set(true); },
    });
  }

  /** Creates a transaction — only on an explicit click, so refreshes don't duplicate it. */
  createPayment(): void {
    if (this.creating() || this.payment()) return;
    this.creating.set(true);
    this.billingApi.createTransaction(this.articleId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (t) => { this.transaction.set(t); this.creating.set(false); },
      error: () => { this.creating.set(false); this.toast.error('cabinet.payment.create_error'); },
    });
  }

  payWithClick(): void {
    const link = this.payment()?.links.click_link;
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  }

  payWithPayme(): void {
    const link = this.payment()?.links.payme_link;
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  }
}
