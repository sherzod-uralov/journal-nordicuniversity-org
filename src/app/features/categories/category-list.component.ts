import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryStore } from '@store/category.store';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { CardComponent } from '@shared/components/card/card.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { SeoService } from '@core/services/seo.service';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent, CardComponent, TranslatePipe, FileUrlPipe, Skeleton, Tag],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
})
export class CategoryListComponent implements OnInit {
  readonly categoryStore = inject(CategoryStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Categories', translateKey: 'nav.categories' }];

  ngOnInit(): void {
    this.seo.update({ title: 'Categories' });
    this.categoryStore.loadCategories();
  }
}
