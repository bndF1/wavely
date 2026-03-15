import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
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
  IonText,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { Subject, switchMap, catchError, of, takeUntil, tap, forkJoin } from 'rxjs';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { Podcast } from '../../core/models/podcast.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

// Genre IDs used to populate the three Browse sections with distinct content.
// Featured → News, New & Noteworthy → Technology, Top → overall chart.
const FEATURED_GENRE_ID = 1489;    // News
const NOTEWORTHY_GENRE_ID = 1318;  // Technology

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
  { id: 1533, name: 'Science', color: '#00ACC1' },
  { id: 1318, name: 'Technology', color: '#FF5722' },
  { id: 1321, name: 'Business', color: '#607D8B' },
  { id: 1309, name: 'TV & Film', color: '#3F51B5' },
  { id: 1310, name: 'Music', color: '#4CAF50' },
  { id: 1545, name: 'Sports', color: '#FF9800' },
  { id: 1488, name: 'True Crime', color: '#424242' },
];

const SKELETON_COUNT = 6;
const CHIP_SKELETON_COUNT = 6;

@Component({
  selector: 'wavely-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    IonText,
    IonButtons,
    IonButton,
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
  protected readonly detectedCountry: string;

  protected selectedCategory = signal(PODCAST_CATEGORIES[0]);
  protected topPodcasts = signal<Podcast[]>([]);
  protected featuredPodcasts = signal<Podcast[]>([]);
  protected newNoteworthyPodcasts = signal<Podcast[]>([]);
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);
  protected globalBrowse = false;

  private readonly category$ = new Subject<PodcastCategory>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.detectedCountry = this.api.detectCountry();
    addIcons({ searchOutline, alertCircleOutline, refreshOutline });

    this.category$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
          this.topPodcasts.set([]);
          this.featuredPodcasts.set([]);
          this.newNoteworthyPodcasts.set([]);
        }),
        switchMap(() => {
          const country = this.globalBrowse ? 'us' : this.detectedCountry;
          return forkJoin({
            topPodcasts: this.api.getTrendingPodcasts(25, undefined, country),
            featuredPodcasts: this.api.getTrendingPodcasts(5, FEATURED_GENRE_ID, country),
            newNoteworthyPodcasts: this.api.getTrendingPodcasts(10, NOTEWORTHY_GENRE_ID, country),
          }).pipe(
            catchError(() => {
              this.error.set('Could not load podcasts. Please try again.');
              return of({
                topPodcasts: [] as Podcast[],
                featuredPodcasts: [] as Podcast[],
                newNoteworthyPodcasts: [] as Podcast[],
              });
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.topPodcasts.set(response.topPodcasts);
        this.featuredPodcasts.set(response.featuredPodcasts);
        this.newNoteworthyPodcasts.set(response.newNoteworthyPodcasts);
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

    if (category.id === 0) {
      this.category$.next(category);
      return;
    }

    // Navigate directly — do not enter the loading pipeline for sub-pages.
    this.router.navigate(['/browse/category', category.id]);
  }

  protected toggleGlobalBrowse(): void {
    this.globalBrowse = !this.globalBrowse;
    this.category$.next(this.selectedCategory());
  }

  protected retryCurrentCategory(): void {
    if (this.selectedCategory().id !== 0) {
      this.router.navigate(['/browse/category', this.selectedCategory().id]);
      return;
    }
    this.category$.next(this.selectedCategory());
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected get countryFlag(): string {
    const code = this.detectedCountry;
    if (!/^[a-z]{2}$/.test(code)) return '🌍';
    return code.split('').map((c) => String.fromCodePoint(c.charCodeAt(0) - 97 + 0x1f1e6)).join('');
  }
}
