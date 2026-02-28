import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-input',
  standalone: true,
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  readonly fieldId = input<string>('');
  readonly placeholder = input<string>('');
  readonly maxDate = input<Date | null>(null);
  readonly minDate = input<Date | null>(null);

  readonly value = signal('');
  readonly isDisabled = signal(false);

  private onChange: (val: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  get maxDateStr(): string {
    return this.dateToString(this.maxDate());
  }

  get minDateStr(): string {
    return this.dateToString(this.minDate());
  }

  writeValue(val: Date | string | null): void {
    if (!val) {
      this.value.set('');
      return;
    }
    if (val instanceof Date) {
      this.value.set(this.dateToString(val));
    } else {
      this.value.set(val);
    }
  }

  registerOnChange(fn: (val: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  onInput(event: Event): void {
    const str = (event.target as HTMLInputElement).value;
    this.value.set(str);
    if (str) {
      const date = new Date(str + 'T00:00:00');
      this.onChange(date);
    } else {
      this.onChange(null);
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  private dateToString(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
