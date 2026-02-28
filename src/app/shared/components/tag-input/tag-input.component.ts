import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly fieldId = input('');

  readonly tags = signal<string[]>([]);
  readonly inputValue = signal('');
  readonly isDisabled = signal(false);
  readonly focused = signal(false);

  private onChange: (val: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string[] | null): void {
    this.tags.set(val ?? []);
  }

  registerOnChange(fn: (val: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
    if (event.key === 'Backspace' && !this.inputValue() && this.tags().length > 0) {
      this.removeTag(this.tags().length - 1);
    }
  }

  addTag(): void {
    const val = this.inputValue().trim().replace(/,+$/, '').trim();
    if (val && !this.tags().includes(val)) {
      const newTags = [...this.tags(), val];
      this.tags.set(newTags);
      this.onChange(newTags);
    }
    this.inputValue.set('');
  }

  removeTag(index: number): void {
    const newTags = this.tags().filter((_, i) => i !== index);
    this.tags.set(newTags);
    this.onChange(newTags);
  }

  onBlur(): void {
    if (this.inputValue().trim()) {
      this.addTag();
    }
    this.focused.set(false);
    this.onTouched();
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onInput(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
  }
}
