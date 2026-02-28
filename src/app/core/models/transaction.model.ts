export type BillingStatus = 'NEW' | 'COMPLETE' | 'CANCELLED' | 'ERROR' | 'PREPARE' | 'AwaitingConfirm' | 'TransactionConfirmed' | 'TransactionCancelled' | 'TransactionCancelledAfterConfirmed';

export type PaymentSystem = 'PAYME' | 'CLICK';

export interface Transaction {
  id: number;
  author_id: string;
  author: {
    id: string;
    full_name: string;
    phone_number: string;
  };
  article_id: string;
  article?: {
    id: string;
    title: string;
    slug: string;
  };
  amount: number;
  status: BillingStatus;
  isFailed: boolean;
  failed_note: string | null;
  transactions_link?: {
    click_link: string;
    payme_link: string;
  };
  payment_system: PaymentSystem;
  createdAt: string;
  updatedAt: string;
}
