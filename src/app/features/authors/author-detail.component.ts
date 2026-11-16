import { Component, inject, OnInit, OnDestroy, input, signal, computed, effect, untracked, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthorStore } from '@store/author.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article } from '@core/models/article.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { Skeleton } from 'primeng/skeleton';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { environment } from '@env';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [ArticleCardComponent, EmptyStateComponent, Skeleton, BreadcrumbComponent, AvatarComponent, TranslatePipe],
  templateUrl: './author-detail.component.html',
  styleUrl: './author-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly authorStore = inject(AuthorStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly articles = signal<Article[]>([]);
  readonly articlesLoading = signal(false);

  /** Selected author, only when it matches the URL (never the previous one). */
  readonly author = computed(() => {
    const a = this.authorStore.selectedAuthor();
    return a && a.id === this.id() ? a : null;
  });

  // There is no /authors list page, so the middle crumb is a plain label
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Authors', translateKey: 'nav.authors' },
    { label: this.author()?.full_name || '...' },
  ]);

  private loadedId: string | null = null;
  private articlesSub?: Subscription;

  constructor() {
    effect(() => {
      const a = this.author();
      const notFound = this.authorStore.notFound();
      untracked(() => {
        if (a) {
          const apiBase = environment.apiUrl.replace(/\/+$/, '');
          const ogImage = a.file?.file_path
            ? `${apiBase}/${a.file.file_path.replace(/^\/+/, '')}`
            : undefined;
          this.seo.update({
            title: a.full_name,
            description: [a.science_degree, a.job, a.place_position].filter(Boolean).join(' — '),
            ogImage,
            ogType: 'profile',
          });
        } else if (notFound && !this.authorStore.loading()) {
          this.seo.update({ title: 'Author not found' });
          this.seo.markNotFound();
        }
      });
    });

    // Reload when the component is reused for another author id
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  ngOnInit(): void {
    this.load(this.id());
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }

  /** Retries a failed load (explicit user action). */
  retry(): void {
    this.loadedId = null;
    this.load(this.id());
  }

  private load(id: string): void {
    if (id === this.loadedId) return;
    this.loadedId = id;
    this.authorStore.loadById(id);

    this.articlesSub?.unsubscribe();
    this.articles.set([]);
    this.articlesLoading.set(true);
    this.articlesSub = this.articleApi.getByAuthor(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (articles) => {
          this.articles.set(articles);
          this.articlesLoading.set(false);
        },
        error: () => this.articlesLoading.set(false),
      });
  }
}
