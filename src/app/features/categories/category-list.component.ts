import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryStore } from '@store/category.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { SeoService } from '@core/services/seo.service';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TranslatePipe, FileUrlPipe, ScrollAnimateDirective, Skeleton],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
})
export class CategoryListComponent implements OnInit {
  readonly categoryStore = inject(CategoryStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Categories', translateKey: 'nav.categories' },
  ];

  ngOnInit(): void {
    this.seo.update({ title: 'Categories' });
    this.categoryStore.loadCategories();
  }

  padIndex(i: number): string {
    return String(i + 1).padStart(2, '0');
  }
}
