import { Component, inject, OnInit, OnDestroy, input, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { AuthorStore } from '@store/author.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article } from '@core/models/article.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { Skeleton } from 'primeng/skeleton';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { environment } from '@env';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [ArticleCardComponent, Skeleton, BreadcrumbComponent, AvatarComponent, TranslatePipe],
  templateUrl: './author-detail.component.html',
  styleUrl: './author-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly authorStore = inject(AuthorStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);
  readonly articles = signal<Article[]>([]);

  constructor() {
    effect(() => {
      const a = this.authorStore.selectedAuthor();
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
      }
    });
  }

  ngOnInit(): void {
    this.authorStore.loadById(this.id());
    this.articleApi.getByAuthor(this.id()).subscribe(a => this.articles.set(a));
  }

  ngOnDestroy(): void {
    this.seo.resetMeta();
  }

  get breadcrumbs(): BreadcrumbItem[] {
    return [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Authors', translateKey: 'nav.authors', route: '/authors' }, { label: this.authorStore.selectedAuthor()?.full_name || '...' }];
  }
}
