import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { addIcons } from 'ionicons';
import { alertCircleOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { catchError, of, switchMap, tap } from 'rxjs';

import { Podcast } from '../../../core/models/podcast.model';
import { PodcastApiService } from '../../../core/services/podcast-api.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PodcastCardComponent } from '../../../shared/components/podcast-card/podcast-card.component';
import { PODCAST_CATEGORIES } from '../browse.page';

const SKELETON_COUNT = 6;
const PAGE_SIZE = 12;

@Component({
  selector: 'wavely-category-detail',
  standalone: true,
  templateUrl: './category-detail.page.html',
  styleUrls: ['./category-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonSkeletonText,
    IonTitle,
    IonToolbar,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class CategoryDetailPage {
  private readonly api = inject(PodcastApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });

  protected readonly genreId = signal<number | null>(null);
  protected readonly genreName = signal('Category');
  protected readonly podcasts = signal<Podcast[]>([]);
  protected readonly visibleCount = signal(PAGE_SIZE);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visiblePodcasts = computed(() =>
    this.podcasts().slice(0, this.visibleCount())
  );
  protected readonly canLoadMore = computed(
    () => this.visiblePodcasts().length < this.podcasts().length
  );

  constructor() {
    addIcons({ searchOutline, alertCircleOutline, refreshOutline });

    this.route.paramMap
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
          this.podcasts.set([]);
          this.visibleCount.set(PAGE_SIZE);
        }),
        switchMap((params) => {
          const rawGenreId = Number(params.get('genreId'));

          if (!Number.isInteger(rawGenreId) || rawGenreId <= 0) {
            this.genreId.set(null);
            this.genreName.set('Category');
            this.error.set('Invalid category. Please go back and try another one.');
            return of([] as Podcast[]);
          }

          this.genreId.set(rawGenreId);
          this.genreName.set(
            PODCAST_CATEGORIES.find((category) => category.id === rawGenreId)?.name ??
              'Category'
          );

          return this.api.getTrendingPodcasts(50, rawGenreId).pipe(
            catchError(() => {
              this.error.set('Could not load this category. Please try again.');
              return of([] as Podcast[]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((podcasts) => {
        this.podcasts.set(podcasts);
        this.visibleCount.set(Math.min(PAGE_SIZE, podcasts.length));
        this.isLoading.set(false);
      });
  }

  protected loadMore(): void {
    this.visibleCount.update((count) =>
      Math.min(count + PAGE_SIZE, this.podcasts().length)
    );
  }

  protected retry(): void {
    const currentGenreId = this.genreId();
    if (!currentGenreId) {
      this.error.set('Invalid category. Please go back and try another one.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.api
      .getTrendingPodcasts(50, currentGenreId)
      .pipe(
        catchError(() => {
          this.error.set('Could not load this category. Please try again.');
          return of([] as Podcast[]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((podcasts) => {
        this.podcasts.set(podcasts);
        this.visibleCount.set(Math.min(PAGE_SIZE, podcasts.length));
        this.isLoading.set(false);
      });
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }
}
