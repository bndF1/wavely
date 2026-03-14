import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonChip,
  IonLabel,
  IonSkeletonText,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { Subject, switchMap, catchError, of, takeUntil, tap } from 'rxjs';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { Podcast } from '../../core/models/podcast.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

export interface PodcastCategory {
  id: number;
  name: string;
  color: string;
}

export const PODCAST_CATEGORIES: PodcastCategory[] = [
  { id: 0, name: 'All', color: '#1A73E8' },
  { id: 1489, name: 'News', color: '#EA4335' },
  { id: 1304, name: 'Education', color: '#34A853' },
  { id: 1303, name: 'Comedy', color: '#FBBC04' },
  { id: 1301, name: 'Arts', color: '#9C27B0' },
  { id: 1307, name: 'Science', color: '#00ACC1' },
  { id: 1318, name: 'Technology', color: '#FF5722' },
  { id: 1321, name: 'Business', color: '#607D8B' },
  { id: 1309, name: 'TV & Film', color: '#3F51B5' },
  { id: 1310, name: 'Music', color: '#4CAF50' },
  { id: 1323, name: 'Sports', color: '#FF9800' },
  { id: 1324, name: 'True Crime', color: '#424242' },
];

const SKELETON_COUNT = 6;
const CHIP_SKELETON_COUNT = 6;

@Component({
  selector: 'wavely-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonChip,
    IonLabel,
    IonSkeletonText,
    IonCard,
    IonCardContent,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class BrowsePage implements OnDestroy {
  private readonly api = inject(PodcastApiService);
  private readonly router = inject(Router);

  protected readonly categories = PODCAST_CATEGORIES;
  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  protected readonly chipSkeletons = Array.from({ length: CHIP_SKELETON_COUNT });
  protected readonly skeletonPodcast: Podcast = {
    id: '',
    title: '',
    author: '',
    description: '',
    artworkUrl: '',
    feedUrl: '',
    genres: [],
  };

  protected selectedCategory = signal(PODCAST_CATEGORIES[0]);
  protected topPodcasts = signal<Podcast[]>([]);
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  private readonly category$ = new Subject<PodcastCategory>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({ searchOutline, alertCircleOutline, refreshOutline });

    this.category$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
          this.topPodcasts.set([]);
        }),
        switchMap((cat) => {
          const obs$ = cat.id === 0 ? this.api.getTrendingPodcasts(25) : this.api.getTrendingPodcasts(25, cat.id);
          return obs$.pipe(
            catchError(() => {
              this.error.set('Could not load podcasts. Please try again.');
              return of([] as Podcast[]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((podcasts) => {
        this.topPodcasts.set(podcasts);
        this.isLoading.set(false);
      });

    this.category$.next(this.selectedCategory());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected selectCategory(category: PodcastCategory): void {
    if (this.selectedCategory().id === category.id) return;
    this.selectedCategory.set(category);
    this.category$.next(category);
  }

  protected retryCurrentCategory(): void {
    this.category$.next(this.selectedCategory());
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }
}
