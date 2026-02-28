import { Component, inject } from '@angular/core';
import { LanguageService, Language } from '@core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent {
  readonly languageService = inject(LanguageService);

  readonly languages: { code: Language; label: string }[] = [
    { code: 'uz', label: "O'z" },
    { code: 'ru', label: 'Ру' },
    { code: 'en', label: 'En' },
  ];

  setLang(lang: Language): void {
    this.languageService.setLanguage(lang);
  }
}
