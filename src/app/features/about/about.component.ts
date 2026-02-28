import { Component, inject, OnInit } from '@angular/core';
import { AboutStore } from '@store/about.store';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { CardComponent } from '@shared/components/card/card.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { FileUrlPipe } from '@shared/pipes/file-url.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';
import { Skeleton } from 'primeng/skeleton';
import { Accordion } from 'primeng/accordion';
import { AccordionPanel } from 'primeng/accordion';
import { AccordionHeader } from 'primeng/accordion';
import { AccordionContent } from 'primeng/accordion';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [AvatarComponent, CardComponent, BreadcrumbComponent, FileUrlPipe, SafeHtmlPipe, TranslatePipe, Skeleton, Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit {
  readonly aboutStore = inject(AboutStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'About', translateKey: 'nav.about' }];

  ngOnInit(): void {
    this.seo.update({ title: 'About the Journal' });
    this.aboutStore.loadAbout();
  }
}
