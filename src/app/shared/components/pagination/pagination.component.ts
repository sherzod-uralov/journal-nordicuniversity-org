import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  readonly pages = computed<(number | '...')[]>(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  readonly canPrev = computed(() => this.currentPage() > 1);
  readonly canNext = computed(() => this.currentPage() < this.totalPages());

  goTo(page: number | '...'): void {
    if (page === '...') return;
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  prev(): void {
    if (this.canPrev()) this.goTo(this.currentPage() - 1);
  }

  next(): void {
    if (this.canNext()) this.goTo(this.currentPage() + 1);
  }
}
