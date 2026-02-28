import {
  Component, forwardRef, signal, output, inject,
  PLATFORM_ID, ElementRef, viewChildren, AfterViewInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true,
    },
  ],
})
export class OtpInputComponent implements ControlValueAccessor, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  readonly completed = output<string>();
  readonly digits = signal<string[]>(['', '', '', '']);
  readonly isDisabled = signal(false);

  readonly otpInputs = viewChildren<ElementRef>('otpBox');

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const inputs = this.otpInputs();
      if (inputs.length > 0) {
        inputs[0].nativeElement.focus();
      }
    }
  }

  writeValue(val: string): void {
    if (!val) {
      this.digits.set(['', '', '', '']);
      return;
    }
    const chars = val.replace(/\D/g, '').slice(0, 4).split('');
    while (chars.length < 4) chars.push('');
    this.digits.set(chars);
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

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const char = input.value.replace(/\D/g, '').slice(-1);

    const current = [...this.digits()];
    current[index] = char;
    this.digits.set(current);
    input.value = char;

    this.emitValue(current);

    if (char && index < 3) {
      this.focusInput(index + 1);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const current = [...this.digits()];
      if (!current[index] && index > 0) {
        current[index - 1] = '';
        this.digits.set(current);
        this.emitValue(current);
        this.focusInput(index - 1);
        event.preventDefault();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 3) {
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const chars = pasted.split('');
    while (chars.length < 4) chars.push('');
    this.digits.set(chars);

    // Update input values
    const inputs = this.otpInputs();
    chars.forEach((c, i) => {
      if (inputs[i]) inputs[i].nativeElement.value = c;
    });

    this.emitValue(chars);

    // Focus last filled or the next empty
    const lastIdx = Math.min(pasted.length, 3);
    this.focusInput(lastIdx);
  }

  onFocus(): void {
    // no-op for now, handled by onTouched in blur
  }

  onBlur(): void {
    this.onTouched();
  }

  private focusInput(index: number): void {
    const inputs = this.otpInputs();
    if (inputs[index]) {
      inputs[index].nativeElement.focus();
      inputs[index].nativeElement.select();
    }
  }

  private emitValue(chars: string[]): void {
    const val = chars.join('');
    this.onChange(val);
    if (val.length === 4 && chars.every(c => c !== '')) {
      this.completed.emit(val);
    }
  }
}
