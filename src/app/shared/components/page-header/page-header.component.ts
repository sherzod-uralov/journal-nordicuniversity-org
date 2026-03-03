import { Component, input , ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [BreadcrumbComponent, TranslatePipe],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly breadcrumbs = input.required<BreadcrumbItem[]>();
  readonly titleKey = input<string>();
  readonly title = input<string>();
}
