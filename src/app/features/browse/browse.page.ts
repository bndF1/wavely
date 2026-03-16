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
  IonThumbnail,
  IonList,
  IonItem,
  IonBadge,
  IonIcon,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, refreshOutline, searchOutline, radioOutline } from 'ionicons/icons';
import { Subject, switchMap, catchError, of, takeUntil, tap, forkJoin } from 'rxjs';
import { SlicePipe } from '@angular/common';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { Podcast } from '../../core/models/podcast.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CountryService, PODCAST_MARKETS } from '../../core/services/country.service';
import { RadioApiService, radioStationToEpisode } from '../../core/services/radio-api.service';
import { RadioStation } from '../../core/models/radio-station.model';
import { PlayerStore } from '../../store/player/player.store';

// Genre IDs used to populate the three Browse sections with distinct content.
// Featured → News, New & Noteworthy → Technology, Top → overall chart.
const FEATURED_GENRE_ID = 1489;    // News
const NOTEWORTHY_GENRE_ID = 1318;  // Technology

import type { PodcastCategory } from './browse.constants';
import { PODCAST_CATEGORIES } from './browse.constants';
export type { PodcastCategory };
export { PODCAST_CATEGORIES };

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
    IonThumbnail,
    IonList,
    IonItem,
    IonBadge,
    IonIcon,
    SlicePipe,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class BrowsePage implements OnDestroy {
  private readonly api = inject(PodcastApiService);
  private readonly radioApi = inject(RadioApiService);
  private readonly playerStore = inject(PlayerStore);
  private readonly router = inject(Router);
  protected readonly countryService = inject(CountryService);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  protected readonly categories = PODCAST_CATEGORIES;
  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  protected readonly chipSkeletons = Array.from({ length: CHIP_SKELETON_COUNT });

  protected selectedCategory = signal(PODCAST_CATEGORIES[0]);
  protected topPodcasts = signal<Podcast[]>([]);
  protected featuredPodcasts = signal<Podcast[]>([]);
  protected newNoteworthyPodcasts = signal<Podcast[]>([]);
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  protected radioStations = signal<RadioStation[]>([]);
  protected isRadioLoading = signal(false);
  protected radioError = signal<string | null>(null);

  // Drives radio loading; switchMap cancels any in-flight request on country change.
  private readonly radioCountry$ = new Subject<string>();

  private readonly category$ = new Subject<PodcastCategory>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({ searchOutline, alertCircleOutline, refreshOutline, radioOutline });

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
          const country = this.countryService.country();
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

    // Radio loading pipeline — switchMap cancels in-flight requests on country change.
    this.radioCountry$
      .pipe(
        tap(() => {
          this.isRadioLoading.set(true);
          this.radioError.set(null);
          this.radioStations.set([]);
        }),
        switchMap((country) =>
          this.radioApi.getStationsByCountry(country).pipe(
            catchError(() => {
              this.radioError.set('Could not load radio stations. Please try again.');
              return of([] as RadioStation[]);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((stations) => {
        this.radioStations.set(stations);
        this.isRadioLoading.set(false);
      });

    this.radioCountry$.next(this.countryService.country());
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

  protected async presentCountryPicker(): Promise<void> {
    const currentCode = this.countryService.country();
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Browse by Country',
      buttons: [
        ...PODCAST_MARKETS.map((m) => ({
          text: `${this.countryService.getFlag(m.code)} ${m.name}`,
          cssClass: m.code === currentCode ? 'country-active' : '',
          handler: () => {
            this.countryService.setCountry(m.code);
            this.category$.next(this.selectedCategory());
            this.radioCountry$.next(m.code);
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await actionSheet.present();
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

  protected playStation(station: RadioStation): void {
    this.radioApi.registerClick(station.stationuuid).subscribe();
    this.playerStore.play(radioStationToEpisode(station));
  }

  protected retryRadio(): void {
    this.radioCountry$.next(this.countryService.country());
  }

  protected get currentMarketName(): string {
    const code = this.countryService.country();
    return PODCAST_MARKETS.find((m) => m.code === code)?.name ?? code.toUpperCase();
  }
}
