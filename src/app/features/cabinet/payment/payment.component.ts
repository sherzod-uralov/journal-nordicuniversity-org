import { Component, inject, OnInit, input, signal } from '@angular/core';
import { BillingApiService } from '@services/api/billing-api.service';
import { Transaction } from '@core/models/transaction.model';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit {
  readonly articleId = input.required<string>();
  private readonly billingApi = inject(BillingApiService);
  readonly transaction = signal<Transaction | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.billingApi.createTransaction(this.articleId()).subscribe({
      next: (t) => { this.transaction.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  payWithClick(): void {
    const link = this.transaction()?.transactions_link?.click_link;
    if (link) window.open(link, '_blank');
  }

  payWithPayme(): void {
    const link = this.transaction()?.transactions_link?.payme_link;
    if (link) window.open(link, '_blank');
  }
}
