import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '@core/services/language.service';

@Pipe({ name: 'localize', pure: false, standalone: true })
export class LocalizePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(obj: unknown, prefix: string): string {
    return this.languageService.localize(obj as Record<string, unknown>, prefix);
  }
}
