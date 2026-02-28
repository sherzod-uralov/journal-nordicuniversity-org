import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks = [
    { path: '/articles', label: 'nav.articles' },
    { path: '/volumes', label: 'nav.volumes' },
    { path: '/categories', label: 'nav.categories' },
    { path: '/guidelines', label: 'nav.guidelines' },
    { path: '/news', label: 'nav.news' },
    { path: '/about', label: 'nav.about' },
  ];
}
