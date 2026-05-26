import { Component, inject, OnInit, computed, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@store/auth.store';
import { UpdateAuthorPayload } from '@services/api/author-api.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { DateInputComponent } from '@shared/components/date-input/date-input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { Button } from 'primeng/button';

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
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  readonly authStore = inject(AuthStore);

  readonly profile = this.authStore.profile;
  readonly loading = this.authStore.loading;
  readonly editMode = signal(false);

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
        this.birthdayDate = p.birthday ? new Date(p.birthday) : null;
        this.password = '';
      }
    });
  }

  ngOnInit(): void {
    if (!this.profile()) {
      this.authStore.loadProfile();
    }
  }

  startEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.password = '';
    const p = this.profile();
    if (p) {
      this.full_name = p.full_name ?? '';
      this.phone_number = p.phone_number ?? '';
      this.science_degree = p.science_degree ?? '';
      this.job = p.job ?? '';
      this.place_position = p.place_position ?? '';
      this.OrcID = p.OrcID ?? '';
      this.birthdayDate = p.birthday ? new Date(p.birthday) : null;
    }
  }

  save(): void {
    const payload: UpdateAuthorPayload = {
      full_name: this.full_name.trim(),
      phone_number: this.phone_number.trim(),
      science_degree: this.science_degree.trim(),
      job: this.job.trim(),
      place_position: this.place_position.trim(),
      OrcID: this.OrcID.trim() || undefined,
      birthday: this.birthdayDate ? this.birthdayDate.toISOString().split('T')[0] : undefined,
    };
    if (this.password.trim().length > 0) {
      payload.password = this.password.trim();
    }
    this.authStore.updateProfile(payload);
    this.editMode.set(false);
    this.password = '';
  }
}
