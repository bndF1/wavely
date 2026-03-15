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
import { alertCircleOutline, refreshOutline } from 'ionicons/icons';
import { catchError, of, switchMap, tap } from 'rxjs';

import { Podcast } from '../../core/models/podcast.model';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { CountryService } from '../../core/services/country.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';

const SKELETON_COUNT = 6;
const PAGE_SIZE = 12;

@Component({
  selector: 'wavely-publisher',
  standalone: true,
  templateUrl: './publisher.page.html',
  styleUrls: ['./publisher.page.scss'],
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
export class PublisherPage {
  private readonly api = inject(PodcastApiService);
  private readonly countryService = inject(CountryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });

  protected readonly artistId = signal<string | null>(null);
  protected readonly publisherName = signal('Publisher');
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
    addIcons({ alertCircleOutline, refreshOutline });

    this.route.paramMap
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
          this.podcasts.set([]);
          this.visibleCount.set(PAGE_SIZE);
        }),
        switchMap((params) => {
          const id = params.get('artistId');

          if (!id) {
            this.error.set('Invalid publisher. Please go back and try again.');
            return of([] as Podcast[]);
          }

          this.artistId.set(id);

          return this.api.getPublisherPodcasts(id, this.countryService.country()).pipe(
            catchError(() => {
              this.error.set('Could not load this publisher. Please try again.');
              return of([] as Podcast[]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((podcasts) => {
        this.podcasts.set(podcasts);
        this.visibleCount.set(Math.min(PAGE_SIZE, podcasts.length));
        if (podcasts.length > 0) {
          this.publisherName.set(podcasts[0].author);
        }
        this.isLoading.set(false);
      });
  }

  protected loadMore(): void {
    this.visibleCount.update((count) =>
      Math.min(count + PAGE_SIZE, this.podcasts().length)
    );
  }

  protected retry(): void {
    const id = this.artistId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.api
      .getPublisherPodcasts(id, this.countryService.country())
      .pipe(
        catchError(() => {
          this.error.set('Could not load this publisher. Please try again.');
          return of([] as Podcast[]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((podcasts) => {
        this.podcasts.set(podcasts);
        this.visibleCount.set(Math.min(PAGE_SIZE, podcasts.length));
        if (podcasts.length > 0) {
          this.publisherName.set(podcasts[0].author);
        }
        this.isLoading.set(false);
      });
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }
}
