import { Component, input, output, signal, computed , ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchComponent {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly changed = output<boolean>();

  toggle(): void {
    if (this.disabled()) return;
    this.changed.emit(!this.checked());
  }
}
