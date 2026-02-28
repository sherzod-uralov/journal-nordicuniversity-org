import { Component, inject, OnInit } from '@angular/core';
import { VolumeStore } from '@store/volume.store';
import { VolumeCardComponent } from '@shared/components/volume-card/volume-card.component';
import { Skeleton } from 'primeng/skeleton';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SeoService } from '@core/services/seo.service';

@Component({
  selector: 'app-volume-list',
  standalone: true,
  imports: [VolumeCardComponent, Skeleton, BreadcrumbComponent, TranslatePipe],
  templateUrl: './volume-list.component.html',
  styleUrl: './volume-list.component.css',
})
export class VolumeListComponent implements OnInit {
  readonly volumeStore = inject(VolumeStore);
  private readonly seo = inject(SeoService);
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', translateKey: 'nav.home', route: '/' }, { label: 'Volumes', translateKey: 'nav.volumes' }];

  ngOnInit(): void {
    this.seo.update({ title: 'Volumes' });
    this.volumeStore.loadVolumes();
  }
}
