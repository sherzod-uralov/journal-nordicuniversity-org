import { Component, inject, afterNextRender, DestroyRef, signal, computed, ElementRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
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

  readonly articleSuggestions = computed(() =>
    this.searchStore.suggestions().filter(s => s.type === 'article')
  );

  readonly categorySuggestions = computed(() =>
    this.searchStore.suggestions().filter(s => s.type === 'category')
  );

  readonly historySuggestions = computed(() =>
    this.searchStore.suggestions().filter(s => s.type === 'history')
  );

  private readonly globalIndexMap = computed(() => {
    const map = new Map<string, number>();
    const suggestions = this.searchStore.suggestions();
    const counts: Record<string, number> = {};
    for (let i = 0; i < suggestions.length; i++) {
      const type = suggestions[i].type;
      const localIdx = counts[type] ?? 0;
      map.set(`${type}:${localIdx}`, i);
      counts[type] = localIdx + 1;
    }
    return map;
  });

  getGlobalIndex(type: string, localIndex: number): number {
    return this.globalIndexMap().get(`${type}:${localIndex}`) ?? -1;
  }
}
