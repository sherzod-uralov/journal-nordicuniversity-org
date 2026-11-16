import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
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
import { SearchService } from '@core/services/search.service';
import { Skeleton } from 'primeng/skeleton';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ToggleSwitchComponent } from '@shared/components/toggle-switch/toggle-switch.component';
import { DatepickerComponent } from '@shared/components/datepicker/datepicker.component';
import { parseLocalDate, toLocalDateString } from '@core/utils/date.util';

type SortValue = 'newest' | 'oldest' | 'most_viewed';
const SORT_VALUES: SortValue[] = ['newest', 'oldest', 'most_viewed'];

/** "1,2,3" → [1, 2, 3] (invalid entries dropped). */
function parseIds(value: string | null): number[] {
  if (!value) return [];
  return value.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
}

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    DatePipe, FormsModule, ArticleCardComponent,
    EmptyStateComponent, PageHeaderComponent,
    TranslatePipe, ScrollAnimateDirective,
    Skeleton, PaginationComponent,
    ToggleSwitchComponent, DatepickerComponent,
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleListComponent implements OnInit {
  readonly articleStore = inject(ArticleStore);
  readonly categoryStore = inject(CategoryStore);
  readonly volumeStore = inject(VolumeStore);
  private readonly subcategoryApi = inject(SubcategoryApiService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchService = inject(SearchService);

  // Filter signals
  readonly searchQuery = signal('');
  readonly selectedCategories = signal<number[]>([]);
  readonly selectedSubCategories = signal<number[]>([]);
  readonly selectedVolumes = signal<number[]>([]);
  readonly existDoi = signal(false);
  readonly dateStart = signal<Date | null>(null);
  readonly dateEnd = signal<Date | null>(null);
  readonly sortValue = signal<SortValue>('newest');

  // Data
  readonly subcategories = signal<SubCategory[]>([]);
  private lastPage = 1;

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
    const subs = this.subcategories().filter(s => s.name);
    if (cats.length === 0) return subs;
    return subs.filter(s => cats.includes(s.categoryId));
  });

  private readonly categoryNameMap = computed(() =>
    new Map(this.categoryStore.categories().map(c => [c.id, c.name]))
  );

  private readonly subcategoryNameMap = computed(() =>
    new Map(this.subcategories().map(s => [s.id, s.name]))
  );

  private readonly volumeNameMap = computed(() =>
    new Map(this.volumeStore.volumes().map(v => [v.id, v.title]))
  );

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


  ngOnInit(): void {
    this.seo.update({ title: 'Articles', description: 'Browse peer-reviewed scientific articles' });

    // The URL is the source of truth for search, filters and page: header search
    // (/articles?q=…) and Back/Forward both re-run the search. Emits synchronously
    // on subscribe, so the first search starts during the initial render.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const page = this.applyQueryParams(params);
        this.doSearch(page);
      });

    this.categoryStore.loadCategories();
    this.volumeStore.loadVolumes();
    this.subcategoryApi.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(subs => this.subcategories.set(subs));
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.updateUrl(1);
    }
  }

  /** Search box submit. */
  submitSearch(): void {
    this.updateUrl(1);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.updateUrl(1);
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
    this.updateUrl(1);
  }

  toggleSubCategory(id: number): void {
    const current = this.selectedSubCategories();
    if (current.includes(id)) {
      this.selectedSubCategories.set(current.filter(s => s !== id));
    } else {
      this.selectedSubCategories.set([...current, id]);
    }
    this.updateUrl(1);
  }

  toggleVolume(id: number): void {
    const current = this.selectedVolumes();
    if (current.includes(id)) {
      this.selectedVolumes.set(current.filter(v => v !== id));
    } else {
      this.selectedVolumes.set([...current, id]);
    }
    this.updateUrl(1);
  }

  onDoiChange(): void {
    this.updateUrl(1);
  }

  onDateStartChange(): void {
    this.updateUrl(1);
  }

  onDateEndChange(): void {
    this.updateUrl(1);
  }

  onSortChange(value: SortValue): void {
    this.sortValue.set(value);
    this.updateUrl(1);
  }

  onPageChange(page: number): void {
    // New history entry per page, so Back returns to the previous page
    this.updateUrl(page, false);
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
    this.updateUrl(1);
  }

  /** Re-runs the current search (after an error). */
  retrySearch(): void {
    this.doSearch(this.lastPage);
  }

  /** Sets the filter signals from the URL; returns the requested page. */
  private applyQueryParams(params: ParamMap): number {
    const sort = params.get('sort') as SortValue | null;
    this.searchQuery.set(params.get('q') ?? '');
    this.selectedCategories.set(parseIds(params.get('cat')));
    this.selectedSubCategories.set(parseIds(params.get('sub')));
    this.selectedVolumes.set(parseIds(params.get('vol')));
    this.existDoi.set(params.get('doi') === '1');
    this.dateStart.set(parseLocalDate(params.get('from')));
    this.dateEnd.set(parseLocalDate(params.get('to')));
    this.sortValue.set(sort && SORT_VALUES.includes(sort) ? sort : 'newest');
    const page = Number(params.get('page'));
    return Number.isInteger(page) && page > 1 ? page : 1;
  }

  /** Mirrors the filters + page into the URL; the queryParamMap subscription runs the search. */
  private updateUrl(page: number, replaceUrl = true): void {
    const queryParams: Params = {
      q: this.searchQuery().trim() || null,
      cat: this.selectedCategories().join(',') || null,
      sub: this.selectedSubCategories().join(',') || null,
      vol: this.selectedVolumes().join(',') || null,
      doi: this.existDoi() ? '1' : null,
      from: toLocalDateString(this.dateStart()) || null,
      to: toLocalDateString(this.dateEnd()) || null,
      sort: this.sortValue() !== 'newest' ? this.sortValue() : null,
      page: page > 1 ? page : null,
    };
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl });
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
        start: toLocalDateString(this.dateStart()),
        end: toLocalDateString(this.dateEnd()),
      },
      sort,
    };
  }

  getCategoryName(id: number): string {
    return this.categoryNameMap().get(id) ?? '';
  }

  getSubCategoryName(id: number): string {
    return this.subcategoryNameMap().get(id) ?? '';
  }

  getVolumeName(id: number): string {
    return this.volumeNameMap().get(id) ?? '';
  }

  clearDates(): void {
    this.dateStart.set(null);
    this.dateEnd.set(null);
    this.updateUrl(1);
  }

  private doSearch(page: number): void {
    this.lastPage = page;
    const query = this.searchQuery();
    if (query.trim() && page === 1) {
      this.searchService.addToHistory(query);
    }
    this.articleStore.searchArticles({
      body: this.buildFilterBody(),
      page,
      limit: 12,
    });
  }
}
