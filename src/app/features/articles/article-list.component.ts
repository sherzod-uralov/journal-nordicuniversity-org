import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticleStore } from '@store/article.store';
import { CategoryStore } from '@store/category.store';
import { VolumeStore } from '@store/volume.store';
import { SubcategoryApiService } from '@services/api/subcategory-api.service';
import { SubCategory } from '@core/models/category.model';
import { ArticleFilterBody } from '@core/models/article.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { SeoService } from '@core/services/seo.service';
import { Paginator } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';
import { Checkbox } from 'primeng/checkbox';
import { RadioButton } from 'primeng/radiobutton';
import { ToggleSwitchComponent } from '@shared/components/toggle-switch/toggle-switch.component';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    DatePipe, FormsModule, ArticleCardComponent,
    EmptyStateComponent, PageHeaderComponent,
    TranslatePipe, ScrollAnimateDirective,
    Paginator, Skeleton, Checkbox, RadioButton,
    ToggleSwitchComponent, DatePicker,
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.css',
})
export class ArticleListComponent implements OnInit {
  readonly articleStore = inject(ArticleStore);
  readonly categoryStore = inject(CategoryStore);
  readonly volumeStore = inject(VolumeStore);
  private readonly subcategoryApi = inject(SubcategoryApiService);
  private readonly seo = inject(SeoService);

  // Filter signals
  readonly searchQuery = signal('');
  readonly selectedCategories = signal<number[]>([]);
  readonly selectedSubCategories = signal<number[]>([]);
  readonly selectedVolumes = signal<number[]>([]);
  readonly existDoi = signal(false);
  readonly dateStart = signal<Date | null>(null);
  readonly dateEnd = signal<Date | null>(null);
  readonly sortValue = signal<'newest' | 'oldest' | 'most_viewed'>('newest');

  // Data
  readonly subcategories = signal<SubCategory[]>([]);

  // UI state
  readonly searchFocused = signal(false);
  readonly showMobileFilters = signal(false);
  readonly showCategorySection = signal(false);
  readonly showSubCategorySection = signal(false);
  readonly showVolumeSection = signal(false);
  readonly showDateSection = signal(false);
  readonly showSortSection = signal(false);

  readonly sortOptions = [
    { value: 'newest' as const, label: 'articles.sort.newest' },
    { value: 'oldest' as const, label: 'articles.sort.oldest' },
    { value: 'most_viewed' as const, label: 'articles.sort.views' },
  ];

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Articles', translateKey: 'nav.articles' },
  ];

  readonly filteredSubCategories = computed(() => {
    const cats = this.selectedCategories();
    const subs = this.subcategories();
    if (cats.length === 0) return subs;
    return subs.filter(s => cats.includes(s.categoryId));
  });

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchQuery()) count++;
    if (this.selectedCategories().length) count++;
    if (this.selectedSubCategories().length) count++;
    if (this.selectedVolumes().length) count++;
    if (this.existDoi()) count++;
    if (this.dateStart() || this.dateEnd()) count++;
    return count;
  });

  // Paginator helper
  readonly first = computed(() => (this.articleStore.currentPage() - 1) * 12);

  ngOnInit(): void {
    this.seo.update({ title: 'Articles', description: 'Browse peer-reviewed scientific articles' });
    this.doSearch(1);
    this.categoryStore.loadCategories();
    this.volumeStore.loadVolumes();
    this.subcategoryApi.getAll().subscribe(subs => this.subcategories.set(subs));
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.doSearch(1);
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.doSearch(1);
  }

  toggleCategory(id: number): void {
    const current = this.selectedCategories();
    if (current.includes(id)) {
      this.selectedCategories.set(current.filter(c => c !== id));
      const subsToRemove = this.subcategories().filter(s => s.categoryId === id).map(s => s.id);
      this.selectedSubCategories.update(subs => subs.filter(s => !subsToRemove.includes(s)));
    } else {
      this.selectedCategories.set([...current, id]);
    }
    this.doSearch(1);
  }

  toggleSubCategory(id: number): void {
    const current = this.selectedSubCategories();
    if (current.includes(id)) {
      this.selectedSubCategories.set(current.filter(s => s !== id));
    } else {
      this.selectedSubCategories.set([...current, id]);
    }
    this.doSearch(1);
  }

  toggleVolume(id: number): void {
    const current = this.selectedVolumes();
    if (current.includes(id)) {
      this.selectedVolumes.set(current.filter(v => v !== id));
    } else {
      this.selectedVolumes.set([...current, id]);
    }
    this.doSearch(1);
  }

  onDoiChange(): void {
    this.doSearch(1);
  }

  onDateStartChange(): void {
    this.doSearch(1);
  }

  onDateEndChange(): void {
    this.doSearch(1);
  }

  onSortChange(value: 'newest' | 'oldest' | 'most_viewed'): void {
    this.sortValue.set(value);
    this.doSearch(1);
  }

  onPageChange(event: { first?: number; rows?: number; page?: number }): void {
    this.doSearch((event.page ?? 0) + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategories.set([]);
    this.selectedSubCategories.set([]);
    this.selectedVolumes.set([]);
    this.existDoi.set(false);
    this.dateStart.set(null);
    this.dateEnd.set(null);
    this.sortValue.set('newest');
    this.doSearch(1);
  }

  private formatDate(d: Date | null): string {
    if (!d) return '';
    return d.toISOString().split('T')[0];
  }

  private buildFilterBody(): ArticleFilterBody {
    const sort: ArticleFilterBody['sort'] = { createdAt: 'DESC', viewsCount: 'ASC' };
    switch (this.sortValue()) {
      case 'newest': sort.createdAt = 'DESC'; sort.viewsCount = 'ASC'; break;
      case 'oldest': sort.createdAt = 'ASC'; sort.viewsCount = 'ASC'; break;
      case 'most_viewed': sort.createdAt = 'DESC'; sort.viewsCount = 'DESC'; break;
    }

    return {
      mainFilter: {
        title: this.searchQuery(),
        volume: this.selectedVolumes(),
        subCategory: this.selectedSubCategories(),
        Category: this.selectedCategories(),
        author: [],
      },
      extraFilter: {
        existDoi: this.existDoi(),
      },
      dateFilter: {
        start: this.formatDate(this.dateStart()),
        end: this.formatDate(this.dateEnd()),
      },
      sort,
    };
  }

  getCategoryName(id: number): string {
    return this.categoryStore.categories().find(c => c.id === id)?.name ?? '';
  }

  getSubCategoryName(id: number): string {
    return this.subcategories().find(s => s.id === id)?.name ?? '';
  }

  getVolumeName(id: number): string {
    return this.volumeStore.volumes().find(v => v.id === id)?.title ?? '';
  }

  clearDates(): void {
    this.dateStart.set(null);
    this.dateEnd.set(null);
    this.doSearch(1);
  }

  doSearch(page: number): void {
    this.articleStore.searchArticles({
      body: this.buildFilterBody(),
      page,
      limit: 12,
    });
  }
}
