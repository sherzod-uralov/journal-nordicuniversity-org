import { Component, inject, OnInit, OnDestroy, input, signal } from '@angular/core';
import { AuthorStore } from '@store/author.store';
import { ArticleApiService } from '@services/api/article-api.service';
import { Article } from '@core/models/article.model';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { Skeleton } from 'primeng/skeleton';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [ArticleCardComponent, Skeleton, BreadcrumbComponent, AvatarComponent, TranslatePipe],
  templateUrl: './author-detail.component.html',
  styleUrl: './author-detail.component.css',
})
export class AuthorDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly authorStore = inject(AuthorStore);
  private readonly articleApi = inject(ArticleApiService);
  private readonly seo = inject(SeoService);
  readonly articles = signal<Article[]>([]);

  ngOnInit(): void {
    this.authorStore.loadById(this.id());
    this.articleApi.getByAuthor(this.id()).subscribe(a => this.articles.set(a));
  }

  ngOnDestroy(): void { this.authorStore.clearSelected(); }

  get breadcrumbs(): BreadcrumbItem[] {
    return [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Authors', translateKey: 'nav.authors', route: '/authors' }, { label: this.authorStore.selectedAuthor()?.full_name || '...' }];
  }
}
