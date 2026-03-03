import { Component, inject, OnInit, signal, computed, afterNextRender, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  readonly articleStore = inject(ArticleStore);
  readonly volumeStore = inject(VolumeStore);
  private readonly statsApi = inject(StatisticsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stats = signal<StatisticsData | null>(null);
  readonly currentSlide = signal(0);

  readonly sliderArticles = computed(() => this.articleStore.latestArticles().slice(0, 3));

  readonly displayVolumes = computed(() => this.volumeStore.volumes().slice(0, 5));

  readonly featuredMain = computed(() => this.articleStore.featuredArticles()[0] ?? null);

  readonly featuredSidebar = computed(() => {
    const featured = this.articleStore.featuredArticles().slice(1);
    if (featured.length >= 3) return featured.slice(0, 3);
    const home = this.articleStore.homeArticles().filter(
      a => a.id !== this.featuredMain()?.id && !featured.some(f => f.id === a.id)
    );
    return [...featured, ...home].slice(0, 3);
  });

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
    this.statsApi.getStatistics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.stats.set(res.data),
      });
  }

  getCardPos(index: number): number {
    const current = this.currentSlide();
    const total = this.sliderArticles().length || 1;
    return (index - current + total) % total;
  }
}
