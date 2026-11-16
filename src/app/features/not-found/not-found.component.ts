import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe, Button],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    // Real 404 status during SSR (+ noindex) instead of a soft 404
    this.seo.update({ title: 'Page Not Found' });
    this.seo.markNotFound();
  }
}
