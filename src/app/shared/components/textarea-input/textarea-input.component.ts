import { Component, forwardRef, input, signal, ElementRef, viewChild, AfterViewInit , ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea-input',
  standalone: true,
  templateUrl: './textarea-input.component.html',
  styleUrl: './textarea-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaInputComponent),
      multi: true,
    },
  ],
})
export class TextareaInputComponent implements ControlValueAccessor {
  readonly placeholder = input<string>('');
  readonly fieldId = input<string>('');
  readonly rows = input<number>(4);
  readonly maxlength = input<number | null>(null);
  readonly autoResize = input<boolean>(false);

  readonly value = signal('');
  readonly isDisabled = signal(false);

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.value.set(textarea.value);
    this.onChange(textarea.value);
    if (this.autoResize()) {
      this.resize(textarea);
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  private resize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
}
