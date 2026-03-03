import { Component, inject, afterNextRender, DestroyRef, signal, ElementRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { SearchStore } from '@store/search.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { HighlightPipe } from '@shared/pipes/highlight.pipe';
import { SearchSuggestion } from '@core/models/search.model';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [TranslatePipe, HighlightPipe],
  templateUrl: './search-overlay.component.html',
  styleUrl: './search-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOverlayComponent {
  readonly searchStore = inject(SearchStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly isMac = signal(false);

  constructor() {
    afterNextRender(() => {
      this.isMac.set(navigator.platform.toUpperCase().includes('MAC'));
      const onKeydown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          if (this.searchStore.isOverlayOpen()) {
            this.searchStore.closeOverlay();
          } else {
            this.searchStore.openOverlay();
            setTimeout(() => this.searchInput()?.nativeElement.focus(), 50);
          }
        }
      };
      document.addEventListener('keydown', onKeydown);
      this.destroyRef.onDestroy(() => document.removeEventListener('keydown', onKeydown));
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('search-backdrop')) {
      this.searchStore.closeOverlay();
    }
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchStore.setQuery(value);
    this.searchStore.loadSuggestions(value);
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.searchStore.navigateSuggestion('down');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.searchStore.navigateSuggestion('up');
        break;
      case 'Enter':
        event.preventDefault();
        this.handleEnter();
        break;
      case 'Escape':
        event.preventDefault();
        this.searchStore.closeOverlay();
        break;
    }
  }

  private handleEnter(): void {
    const index = this.searchStore.activeSuggestionIndex();
    const query = this.searchStore.query();

    if (query.trim() && index >= 0) {
      const suggestions = this.searchStore.suggestions();
      if (suggestions[index]) {
        this.searchStore.selectSuggestion(suggestions[index]);
        return;
      }
    }

    if (!query.trim() && index >= 0) {
      const history = this.searchStore.searchHistory();
      const trending = this.searchStore.trendingSearches();
      if (index < history.length) {
        this.searchStore.executeSearch(history[index].query);
        return;
      }
      const trendingItem = trending[index - history.length];
      if (trendingItem) {
        this.searchStore.selectSuggestion(trendingItem);
        return;
      }
    }

    if (query.trim()) {
      this.searchStore.executeSearch(query);
    }
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    this.searchStore.selectSuggestion(suggestion);
  }

  selectHistoryItem(query: string): void {
    this.searchStore.executeSearch(query);
  }

  removeHistoryItem(event: MouseEvent, query: string): void {
    event.stopPropagation();
    this.searchStore.removeHistoryItem(query);
  }

  clearHistory(): void {
    this.searchStore.clearHistory();
  }

  getArticleSuggestions(): SearchSuggestion[] {
    return this.searchStore.suggestions().filter(s => s.type === 'article');
  }

  getCategorySuggestions(): SearchSuggestion[] {
    return this.searchStore.suggestions().filter(s => s.type === 'category');
  }

  getHistorySuggestions(): SearchSuggestion[] {
    return this.searchStore.suggestions().filter(s => s.type === 'history');
  }

  getGlobalIndex(type: string, localIndex: number): number {
    const suggestions = this.searchStore.suggestions();
    let count = 0;
    for (const s of suggestions) {
      if (s.type === type) {
        if (count === localIndex) {
          return suggestions.indexOf(s);
        }
        count++;
      }
    }
    return -1;
  }
}
