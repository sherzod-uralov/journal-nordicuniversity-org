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
import { toLocalDateString } from '@core/utils/date.util';
import {
  AuthorFormErrors, AuthorFormField, hasErrors, validateAuthorForm, withoutError,
} from '@shared/validators/author-form.validators';

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

  readonly errors = signal<AuthorFormErrors>({});

  register(): void {
    if (this.loading()) return;
    const errors = validateAuthorForm({
      phone: this.phone,
      password: this.password,
      full_name: this.full_name,
      science_degree: this.science_degree,
      job: this.job,
      place_position: this.place_position,
      birthday: this.birthdayDate,
    }, { mode: 'register' });
    this.errors.set(errors);
    if (hasErrors(errors)) return;

    this.loading.set(true);
    this.authorApi.register({
      phone_number: this.phone.trim(),
      full_name: this.full_name.trim(),
      password: this.password,
      science_degree: this.science_degree.trim(),
      job: this.job.trim(),
      // Local calendar date — toISOString() would shift it a day back east of UTC.
      birthday: toLocalDateString(this.birthdayDate),
      place_position: this.place_position.trim(),
      OrcID: this.OrcID.trim() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('auth.register.success');
        this.router.navigate(['/auth/login']);
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'auth.register.error');
        this.loading.set(false);
      },
    });
  }

  clearError(field: AuthorFormField): void {
    this.errors.update(errors => withoutError(errors, field));
  }
}
