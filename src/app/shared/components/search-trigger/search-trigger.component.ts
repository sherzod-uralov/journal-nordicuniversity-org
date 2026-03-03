import { Component, inject, afterNextRender, signal, ChangeDetectionStrategy } from '@angular/core';
import { SearchStore } from '@store/search.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-search-trigger',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './search-trigger.component.html',
  styleUrl: './search-trigger.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTriggerComponent {
  readonly searchStore = inject(SearchStore);
  readonly isMac = signal(false);

  constructor() {
    afterNextRender(() => {
      this.isMac.set(navigator.platform.toUpperCase().includes('MAC'));
    });
  }

  open(): void {
    this.searchStore.openOverlay();
  }
}
