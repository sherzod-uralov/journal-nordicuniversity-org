import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent {
  readonly placeholder = input('Search...');
  readonly search = output<string>();
  readonly value = signal('');
  readonly focused = signal(false);

  onInput(val: string): void {
    this.value.set(val);
    this.search.emit(val);
  }

  clear(): void {
    this.value.set('');
    this.search.emit('');
  }
}
