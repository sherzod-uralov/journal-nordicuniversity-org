import { Component, inject, OnInit, computed , ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VolumeStore } from '@store/volume.store';
import { Skeleton } from 'primeng/skeleton';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ImageComponent } from '@shared/components/image/image.component';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';
import { SeoService } from '@core/services/seo.service';

@Component({
  selector: 'app-volume-list',
  standalone: true,
  imports: [DatePipe, RouterLink, Skeleton, PageHeaderComponent, TranslatePipe, ImageComponent, ScrollAnimateDirective],
  templateUrl: './volume-list.component.html',
  styleUrl: './volume-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeListComponent implements OnInit {
  readonly volumeStore = inject(VolumeStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', translateKey: 'nav.home', route: '/' },
    { label: 'Volumes', translateKey: 'nav.volumes' },
  ];

  readonly latestVolume = computed(() => {
    const vols = this.volumeStore.volumes();
    return vols.length > 0 ? vols[0] : null;
  });

  readonly archiveVolumes = computed(() => {
    const vols = this.volumeStore.volumes();
    return vols.length > 1 ? vols.slice(1) : [];
  });

  ngOnInit(): void {
    this.seo.update({ title: 'Volumes', description: 'Browse all published volumes of the journal' });
    this.volumeStore.loadVolumes();
  }
}
