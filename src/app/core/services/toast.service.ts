import { inject, Injectable, signal } from '@angular/core';
import { LanguageService } from './language.service';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  leaving?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly lang = inject(LanguageService);
  private counter = 0;

  readonly toasts = signal<ToastItem[]>([]);

  success(message: string): void {
    this.add(message, 'success');
  }

  error(message: string): void {
    this.add(message, 'error');
  }

  info(message: string): void {
    this.add(message, 'info');
  }

  warn(message: string): void {
    this.add(message, 'warn');
  }

  remove(id: number): void {
    // Mark as leaving for exit animation
    this.toasts.update(t => t.map(item => item.id === id ? { ...item, leaving: true } : item));
    setTimeout(() => {
      this.toasts.update(t => t.filter(item => item.id !== id));
    }, 300);
  }

  private add(message: string, type: ToastType): void {
    const id = ++this.counter;
    const translated = this.lang.translate(message);
    this.toasts.update(t => [...t, { id, message: translated, type }]);
    setTimeout(() => this.remove(id), 5000);
  }
}
