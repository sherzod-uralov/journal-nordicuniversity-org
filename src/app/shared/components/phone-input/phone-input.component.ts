import { Component, forwardRef, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ALL_COUNTRIES, DEFAULT_COUNTRY, CountryCode, findCountryByPhone, phoneLocalLength } from '@shared/data/countries';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule, ClickOutsideDirective, TranslatePipe],
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
  readonly countries = ALL_COUNTRIES;
  readonly selectedCountry = signal<CountryCode>(DEFAULT_COUNTRY);
  readonly phoneLocal = signal('');
  readonly isDisabled = signal(false);
  readonly dropdownOpen = signal(false);
  readonly searchQuery = signal('');

  /** Max local digits for the selected country (E.164 fallback for unknown ones). */
  readonly maxDigits = computed(() => phoneLocalLength(this.selectedCountry()).max);
  readonly placeholder = computed(() => this.formatDigits('901234567890123'.slice(0, this.maxDigits())));

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
    const country = findCountryByPhone(val, this.selectedCountry());
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
    const raw = input.value.trim();
    // A pasted international number ("+7 701 …") switches the country.
    if (raw.startsWith('+')) {
      const full = '+' + raw.replace(/\D/g, '');
      const country = findCountryByPhone(full, this.selectedCountry());
      if (country) {
        this.selectedCountry.set(country);
        input.value = full.slice(country.dialCode.length);
      }
    }
    const digits = input.value.replace(/\D/g, '').slice(0, this.maxDigits());
    const formatted = this.formatDigits(digits);
    this.phoneLocal.set(formatted);
    input.value = formatted;
    this.emitValue(digits);
  }

  selectCountry(country: CountryCode): void {
    this.selectedCountry.set(country);
    this.dropdownOpen.set(false);
    this.searchQuery.set('');
    const digits = this.phoneLocal().replace(/\D/g, '').slice(0, this.maxDigits());
    this.phoneLocal.set(this.formatDigits(digits));
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
    const d = digits.replace(/\D/g, '').slice(0, this.maxDigits());
    if (this.selectedCountry().code === 'UZ') {
      // 90 123 45 67
      return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
    }
    // Generic: groups of three, a trailing single digit joins the previous group.
    const groups = d.match(/.{1,3}/g) ?? [];
    if (groups.length > 1 && groups[groups.length - 1].length === 1) {
      groups[groups.length - 2] += groups.pop();
    }
    return groups.join(' ');
  }
}
