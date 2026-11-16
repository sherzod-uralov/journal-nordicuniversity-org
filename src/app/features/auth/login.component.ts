import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@store/auth.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { Button } from 'primeng/button';
import { AuthorFormErrors, AuthorFormField, hasErrors, validateLoginForm, withoutError } from '@shared/validators/author-form.validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink, FormsModule, TranslatePipe,
    PhoneInputComponent, PasswordInputComponent, Button,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);

  phone = '';
  password = '';
  readonly errors = signal<AuthorFormErrors>({});

  onSubmit(): void {
    const phone = this.phone.trim();
    const errors = validateLoginForm({ phone, password: this.password });
    this.errors.set(errors);
    if (hasErrors(errors)) return;
    this.authStore.login({ phone_number: phone, password: this.password });
  }

  clearError(field: AuthorFormField): void {
    this.errors.update(errors => withoutError(errors, field));
  }
}
