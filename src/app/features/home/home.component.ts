import { Component, inject, OnInit, signal, computed, afterNextRender, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleStore } from '@store/article.store';
import { VolumeStore } from '@store/volume.store';
import { StatisticsApiService, StatisticsData } from '@services/api/statistics-api.service';
import { ArticleCardComponent } from '@shared/components/article-card/article-card.component';
import { VolumeCardComponent } from '@shared/components/volume-card/volume-card.component';
import { Skeleton } from 'primeng/skeleton';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DateLocalePipe } from '@shared/pipes/date-locale.pipe';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    ArticleCardComponent,
    VolumeCardComponent,
    Skeleton,
    TranslatePipe,
    DateLocalePipe,
    ScrollAnimateDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  readonly articleStore = inject(ArticleStore);
  readonly volumeStore = inject(VolumeStore);
  private readonly statsApi = inject(StatisticsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stats = signal<StatisticsData | null>(null);
  readonly currentSlide = signal(0);

  readonly sliderArticles = computed(() => this.articleStore.latestArticles().slice(0, 3));

  constructor() {
    afterNextRender(() => {
      const interval = setInterval(() => {
        const len = this.sliderArticles().length;
        if (len > 1) {
          this.currentSlide.update(i => (i + 1) % len);
        }
      }, 4000);
      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  ngOnInit(): void {
    this.articleStore.loadMulti();
    this.volumeStore.loadVolumes();
    this.statsApi.getStatistics().subscribe({
      next: (res) => this.stats.set(res.data),
    });
  }

  getCardPos(index: number): number {
    const current = this.currentSlide();
    const total = this.sliderArticles().length || 1;
    return (index - current + total) % total;
  }
}
