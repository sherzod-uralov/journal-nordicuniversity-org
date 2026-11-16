import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** Inline "something went wrong" block with a retry button. */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './error-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  /** i18n key of the message. */
  readonly message = input('common.error');
  readonly compact = input(false);
  readonly retry = output<void>();
}
