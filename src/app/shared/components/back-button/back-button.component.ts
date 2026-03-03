import { Component, inject , ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
