import { Component, forwardRef, signal, PLATFORM_ID, inject , ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { ALL_COUNTRIES, DEFAULT_COUNTRY, CountryCode } from '@shared/data/countries';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule, ClickOutsideDirective],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
})
export class PhoneInputComponent implements ControlValueAccessor {
  private readonly platformId = inject(PLATFORM_ID);

  readonly countries = ALL_COUNTRIES;
  readonly selectedCountry = signal<CountryCode>(DEFAULT_COUNTRY);
  readonly phoneLocal = signal('');
  readonly isDisabled = signal(false);
  readonly dropdownOpen = signal(false);
  readonly searchQuery = signal('');

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  get filteredCountries(): CountryCode[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.countries;
    return this.countries.filter(
      c => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    );
  }

  writeValue(val: string): void {
    if (!val) {
      this.phoneLocal.set('');
      return;
    }
    // Try to parse incoming full phone number
    const country = this.countries.find(c => val.startsWith(c.dialCode));
    if (country) {
      this.selectedCountry.set(country);
      const local = val.slice(country.dialCode.length);
      this.phoneLocal.set(this.formatDigits(local));
    } else {
      this.phoneLocal.set(val);
    }
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

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    const formatted = this.formatDigits(digits);
    this.phoneLocal.set(formatted);
    input.value = formatted;
    this.emitValue(digits);
  }

  selectCountry(country: CountryCode): void {
    this.selectedCountry.set(country);
    this.dropdownOpen.set(false);
    this.searchQuery.set('');
    const digits = this.phoneLocal().replace(/\D/g, '');
    this.emitValue(digits);
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
  }

  onBlur(): void {
    this.onTouched();
  }

  private emitValue(digits: string): void {
    const full = digits ? `${this.selectedCountry().dialCode}${digits}` : '';
    this.onChange(full);
  }

  private formatDigits(digits: string): string {
    if (!digits) return '';
    const d = digits.replace(/\D/g, '').slice(0, 9);
    const parts: string[] = [];
    if (d.length > 0) parts.push(d.slice(0, 2));
    if (d.length > 2) parts.push(d.slice(2, 5));
    if (d.length > 5) parts.push(d.slice(5, 7));
    if (d.length > 7) parts.push(d.slice(7, 9));
    return parts.join(' ');
  }
}
