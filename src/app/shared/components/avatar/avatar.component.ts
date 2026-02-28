import { Component, input, computed } from '@angular/core';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [FileUrlPipe],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() => {
    const n = this.name();
    if (!n) return '?';
    return n.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  });

  sizeClasses(): string {
    const map = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
    return map[this.size()];
  }
}
