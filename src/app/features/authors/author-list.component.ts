import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorStore } from '@store/author.store';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { CardComponent } from '@shared/components/card/card.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { Paginator } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent, CardComponent, AvatarComponent, TranslatePipe, Paginator, Skeleton],
  templateUrl: './author-list.component.html',
  styleUrl: './author-list.component.css',
})
export class AuthorListComponent implements OnInit {
  readonly authorStore = inject(AuthorStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Authors', translateKey: 'nav.authors' }];

  ngOnInit(): void {
    this.seo.update({ title: 'Authors' });
    this.authorStore.loadAuthors({ page: 1, limit: 20 });
  }

  get first(): number {
    return (this.authorStore.currentPage() - 1) * 20;
  }

  onPageChange(event: { page?: number }): void {
    this.authorStore.loadAuthors({ page: (event.page ?? 0) + 1, limit: 20 });
  }
}
