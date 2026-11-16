import { Component, inject, OnInit, computed, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore, ProfileUpdatePayload } from '@store/auth.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { DateInputComponent } from '@shared/components/date-input/date-input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { Button } from 'primeng/button';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { parseLocalDate, toLocalDateString } from '@core/utils/date.util';
import {
  AuthorFormErrors, AuthorFormField, hasErrors, validateAuthorForm, withoutError,
} from '@shared/validators/author-form.validators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    DateLocalePipe,
    TextInputComponent,
    PasswordInputComponent,
    DateInputComponent,
    PhoneInputComponent,
    Button,
    ErrorStateComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  readonly authStore = inject(AuthStore);

  readonly profile = this.authStore.profile;
  readonly saving = this.authStore.saving;
  readonly loadFailed = this.authStore.profileLoadFailed;
  readonly editMode = signal(false);
  readonly errors = signal<AuthorFormErrors>({});

  readonly avatarLetter = computed(() => {
    const name = this.profile()?.full_name;
    return name ? name[0].toUpperCase() : '?';
  });

  readonly maxDate = new Date();
  full_name = '';
  phone_number = '';
  science_degree = '';
  job = '';
  place_position = '';
  OrcID = '';
  birthdayDate: Date | null = null;
  password = '';

  constructor() {
    effect(() => {
      const p = this.profile();
      if (p && !this.editMode()) {
        this.full_name = p.full_name ?? '';
        this.phone_number = p.phone_number ?? '';
        this.science_degree = p.science_degree ?? '';
        this.job = p.job ?? '';
        this.place_position = p.place_position ?? '';
        this.OrcID = p.OrcID ?? '';
        this.birthdayDate = parseLocalDate(p.birthday);
        this.password = '';
      }
    });
  }

  ngOnInit(): void {
    if (!this.profile()) {
      this.authStore.loadProfile();
    }
  }

  retryLoad(): void {
    this.authStore.loadProfile();
  }

  startEdit(): void {
    this.errors.set({});
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.errors.set({});
    this.password = '';
    const p = this.profile();
    if (p) {
      this.full_name = p.full_name ?? '';
      this.phone_number = p.phone_number ?? '';
      this.science_degree = p.science_degree ?? '';
      this.job = p.job ?? '';
      this.place_position = p.place_position ?? '';
      this.OrcID = p.OrcID ?? '';
      this.birthdayDate = parseLocalDate(p.birthday);
    }
  }

  clearError(field: AuthorFormField): void {
    this.errors.update(errors => withoutError(errors, field));
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    const errors = validateAuthorForm({
      phone: this.phone_number,
      password: this.password,
      full_name: this.full_name,
      science_degree: this.science_degree,
      job: this.job,
      place_position: this.place_position,
      birthday: this.birthdayDate,
    }, { mode: 'profile' });
    this.errors.set(errors);
    if (hasErrors(errors)) return;

    const payload: ProfileUpdatePayload = {
      full_name: this.full_name.trim(),
      phone_number: this.phone_number.trim(),
      science_degree: this.science_degree.trim(),
      job: this.job.trim(),
      place_position: this.place_position.trim(),
      // null (not undefined) so clearing an optional field actually reaches the API.
      OrcID: this.OrcID.trim() || null,
      birthday: toLocalDateString(this.birthdayDate) || null,
    };
    if (this.password.trim().length > 0) {
      payload.password = this.password;
    }
    // Stay in edit mode until the API confirms, so nothing typed is lost on failure.
    const ok = await this.authStore.updateProfile(payload);
    if (ok) {
      this.password = '';
      this.editMode.set(false);
    }
  }
}
