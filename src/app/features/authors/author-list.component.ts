import { Component, inject, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorStore } from '@store/author.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { CardComponent } from '@shared/components/card/card.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { Skeleton } from 'primeng/skeleton';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, CardComponent, AvatarComponent, TranslatePipe, Skeleton, PaginationComponent],
  templateUrl: './author-list.component.html',
  styleUrl: './author-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorListComponent implements OnInit {
  readonly authorStore = inject(AuthorStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Authors', translateKey: 'nav.authors' }];

  ngOnInit(): void {
    this.seo.update({ title: 'Authors' });
    this.authorStore.loadAuthors({ page: 1, limit: 20 });
  }

  onPageChange(page: number): void {
    this.authorStore.loadAuthors({ page, limit: 20 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
