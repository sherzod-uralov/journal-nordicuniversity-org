import { Component, inject, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { SeoService } from '@core/services/seo.service';

@Component({
  selector: 'app-guidelines',
  standalone: true,
  imports: [PageHeaderComponent, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './guidelines.component.html',
  styleUrl: './guidelines.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidelinesComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Guidelines', translateKey: 'nav.guidelines' },
  ];

  readonly sections = [
    {
      number: 1,
      titleKey: 'guidelines.abstract.title',
      icon: 'abstract',
      items: [
        'guidelines.abstract.item1',
        'guidelines.abstract.item2',
        'guidelines.abstract.item3',
        'guidelines.abstract.item4',
      ],
      summaryKey: 'guidelines.abstract.summary',
    },
    {
      number: 2,
      titleKey: 'guidelines.intro.title',
      icon: 'intro',
      items: [
        'guidelines.intro.item1',
        'guidelines.intro.item2',
        'guidelines.intro.item3',
      ],
      summaryKey: 'guidelines.intro.summary',
    },
    {
      number: 3,
      titleKey: 'guidelines.methodology.title',
      icon: 'methodology',
      items: [
        'guidelines.methodology.item1',
      ],
      summaryKey: 'guidelines.methodology.summary',
    },
    {
      number: 4,
      titleKey: 'guidelines.results.title',
      icon: 'results',
      items: [
        'guidelines.results.item1',
      ],
      summaryKey: 'guidelines.results.summary',
    },
    {
      number: 5,
      titleKey: 'guidelines.discussion.title',
      icon: 'discussion',
      items: [
        'guidelines.discussion.item1',
        'guidelines.discussion.item2',
        'guidelines.discussion.item3',
      ],
      summaryKey: 'guidelines.discussion.summary',
    },
    {
      number: 6,
      titleKey: 'guidelines.conclusion.title',
      icon: 'conclusion',
      items: [
        'guidelines.conclusion.item1',
      ],
      summaryKey: 'guidelines.conclusion.summary',
    },
    {
      number: 7,
      titleKey: 'guidelines.acknowledgements.title',
      icon: 'acknowledgements',
      items: [
        'guidelines.acknowledgements.item1',
      ],
      summaryKey: 'guidelines.acknowledgements.summary',
    },
    {
      number: 8,
      titleKey: 'guidelines.references.title',
      icon: 'references',
      items: [
        'guidelines.references.item1',
      ],
      summaryKey: 'guidelines.references.summary',
    },
  ];

  ngOnInit(): void {
    this.seo.update({ title: 'Guidelines' });
  }
}
