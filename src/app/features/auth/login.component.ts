import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@store/auth.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink, FormsModule, TranslatePipe,
    PhoneInputComponent, PasswordInputComponent, Button,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);

  phone = '';
  password = '';

  onSubmit(): void {
    if (this.phone && this.password) {
      this.authStore.login({ phone_number: this.phone, password: this.password });
    }
  }
}
