import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthorApiService } from '@services/api/author-api.service';
import { SmsApiService } from '@services/api/sms-api.service';
import { ToastService } from '@core/services/toast.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { OtpInputComponent } from '@shared/components/otp-input/otp-input.component';
import { DateInputComponent } from '@shared/components/date-input/date-input.component';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink, FormsModule, TranslatePipe,
    PhoneInputComponent, PasswordInputComponent, TextInputComponent,
    OtpInputComponent, DateInputComponent, Button,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnDestroy {
  private readonly authorApi = inject(AuthorApiService);
  private readonly smsApi = inject(SmsApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2 | 3>(1);
  readonly loading = signal(false);
  readonly error = signal('');

  // Step 1 - Phone
  phone = '';

  // Step 2 - OTP
  otp = '';
  verifyID = '';
  readonly resendTimer = signal(0);
  private resendInterval: ReturnType<typeof setInterval> | null = null;

  // Step 3 - Profile
  readonly maxDate = new Date();
  full_name = '';
  password = '';
  science_degree = '';
  job = '';
  birthdayDate: Date | null = null;
  place_position = '';
  OrcID = '';

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  sendOtp(): void {
    if (!this.phone) return;
    this.loading.set(true);
    this.error.set('');
    this.smsApi.checkNumber(this.phone).subscribe({
      next: (res) => {
        this.verifyID = res.verifyID;
        this.step.set(2);
        this.loading.set(false);
        this.startResendTimer();
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Error sending code');
        this.loading.set(false);
      },
    });
  }

  onOtpComplete(code: string): void {
    this.otp = code;
    this.verifyOtp();
  }

  verifyOtp(): void {
    if (!this.verifyID || !this.otp) return;
    this.loading.set(true);
    this.error.set('');
    this.smsApi.verifyNumber(this.verifyID, Number(this.otp)).subscribe({
      next: (res) => {
        if (res.matched) {
          this.step.set(3);
          this.clearResendTimer();
        } else {
          this.toast.error(res.message || 'Invalid code');
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Verification failed');
        this.loading.set(false);
      },
    });
  }

  resendOtp(): void {
    if (this.resendTimer() > 0) return;
    this.otp = '';
    this.sendOtp();
  }

  register(): void {
    if (!this.full_name || !this.password) return;
    this.loading.set(true);
    this.error.set('');
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

  goBackToPhone(): void {
    this.step.set(1);
    this.otp = '';
    this.verifyID = '';
    this.error.set('');
    this.clearResendTimer();
  }

  private startResendTimer(): void {
    this.clearResendTimer();
    this.resendTimer.set(60);
    this.resendInterval = setInterval(() => {
      const current = this.resendTimer();
      if (current <= 1) {
        this.resendTimer.set(0);
        this.clearResendTimer();
      } else {
        this.resendTimer.set(current - 1);
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }
}
