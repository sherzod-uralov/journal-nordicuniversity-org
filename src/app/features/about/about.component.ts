import { Component, inject, OnInit } from '@angular/core';
import { AboutStore } from '@store/about.store';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { CollapsibleComponent } from '@shared/components/collapsible/collapsible.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    AvatarComponent,
    PageHeaderComponent,
    CollapsibleComponent,
    FileUrlPipe,
    SafeHtmlPipe,
    TranslatePipe,
    ScrollAnimateDirective,
    Skeleton,
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit {
  readonly aboutStore = inject(AboutStore);
  private readonly seo = inject(SeoService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'About', translateKey: 'nav.about' },
  ];

  ngOnInit(): void {
    this.seo.update({ title: 'About the Journal' });
    this.aboutStore.loadAbout();
  }
}
