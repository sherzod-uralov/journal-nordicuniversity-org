import { Component, inject, OnInit, computed , ChangeDetectionStrategy } from '@angular/core';
import { AuthStore } from '@store/auth.store';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TranslatePipe, DateLocalePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  readonly authStore = inject(AuthStore);

  readonly profile = this.authStore.profile;
  readonly avatarLetter = computed(() => {
    const name = this.profile()?.full_name;
    return name ? name[0].toUpperCase() : '?';
  });

  ngOnInit(): void {
    if (!this.authStore.profile()) {
      this.authStore.loadProfile();
    }
  }
}
