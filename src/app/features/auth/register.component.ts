import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthorApiService } from '@services/api/author-api.service';
import { ToastService } from '@core/services/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { DateInputComponent } from '@shared/components/date-input/date-input.component';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink, FormsModule, TranslatePipe,
    PhoneInputComponent, PasswordInputComponent, TextInputComponent,
    DateInputComponent, Button,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authorApi = inject(AuthorApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly maxDate = new Date();
  phone = '';
  full_name = '';
  password = '';
  science_degree = '';
  job = '';
  birthdayDate: Date | null = null;
  place_position = '';
  OrcID = '';

  register(): void {
    if (!this.phone || !this.full_name || !this.password) return;
    this.loading.set(true);
    const birthday = this.birthdayDate ? this.birthdayDate.toISOString().split('T')[0] : '';
    this.authorApi.register({
      phone_number: this.phone,
      full_name: this.full_name,
      password: this.password,
      science_degree: this.science_degree,
      job: this.job,
      birthday,
      place_position: this.place_position,
      OrcID: this.OrcID || undefined,
    }).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Registration successful');
        this.router.navigate(['/auth/login']);
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
