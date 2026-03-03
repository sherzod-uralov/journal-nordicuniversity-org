import { Component, input , ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  readonly label = input('');
  readonly fieldId = input('');
  readonly error = input('');
  readonly hint = input('');
  readonly required = input(false);
}
