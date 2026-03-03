import { Component, forwardRef, input, signal, contentChild, TemplateRef , ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, ClickOutsideDirective],
  templateUrl: './select-input.component.html',
  styleUrl: './select-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
  ],
})
export class SelectInputComponent implements ControlValueAccessor {
  readonly options = input<any[]>([]);
  readonly optionLabel = input<string>('label');
  readonly optionValue = input<string>('value');
  readonly placeholder = input<string>('Select...');
  readonly filter = input<boolean>(false);
  readonly fieldId = input<string>('');

  readonly itemTpl = contentChild<TemplateRef<any>>('itemTpl');

  readonly value = signal<any>(null);
  readonly isDisabled = signal(false);
  readonly dropdownOpen = signal(false);
  readonly searchQuery = signal('');

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  get filteredOptions(): any[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.options();
    const labelKey = this.optionLabel();
    return this.options().filter(o => {
      const label = typeof o === 'string' ? o : o[labelKey];
      return String(label).toLowerCase().includes(q);
    });
  }

  get displayLabel(): string {
    const val = this.value();
    if (val == null) return '';
    const valueKey = this.optionValue();
    const labelKey = this.optionLabel();
    const option = this.options().find(o => {
      const optVal = typeof o === 'string' ? o : o[valueKey];
      return optVal === val;
    });
    if (!option) return String(val);
    return typeof option === 'string' ? option : option[labelKey];
  }

  writeValue(val: any): void {
    this.value.set(val);
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  toggleDropdown(): void {
    if (this.isDisabled()) return;
    this.dropdownOpen.update(v => !v);
    if (!this.dropdownOpen()) {
      this.searchQuery.set('');
    }
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
    this.searchQuery.set('');
    this.onTouched();
  }

  selectOption(option: any): void {
    const valueKey = this.optionValue();
    const val = typeof option === 'string' ? option : option[valueKey];
    this.value.set(val);
    this.onChange(val);
    this.dropdownOpen.set(false);
    this.searchQuery.set('');
  }

  getOptionLabel(option: any): string {
    const labelKey = this.optionLabel();
    return typeof option === 'string' ? option : option[labelKey];
  }

  getOptionValue(option: any): any {
    const valueKey = this.optionValue();
    return typeof option === 'string' ? option : option[valueKey];
  }
}
