import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSkeletonText,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  closeCircleOutline,
  refreshOutline,
  searchOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PODCAST_MARKETS, CountryService } from '../../core/services/country.service';
import { SearchHistoryService } from '../../core/services/search-history.service';
import { Podcast } from '../../core/models/podcast.model';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PODCAST_CATEGORIES, PodcastCategory } from '../browse/browse.constants';

const FEATURED_GENRE_ID = 1489;
const NOTEWORTHY_GENRE_ID = 1318;
const SKELETON_COUNT = 6;
const CHIP_SKELETON_COUNT = 6;
const DEBOUNCE_MS = 300;

@Component({
  selector: 'wavely-discover',
  standalone: true,
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonSkeletonText,
    IonCard,
    IonCardContent,
    IonText,
    IonList,
    IonItem,
    IonThumbnail,
    IonIcon,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class DiscoverPage implements OnDestroy {
  @ViewChild(IonSearchbar) private searchbar?: IonSearchbar;

  private readonly api = inject(PodcastApiService);
  private readonly searchHistory = inject(SearchHistoryService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);
  protected readonly countryService = inject(CountryService);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  protected readonly categories = PODCAST_CATEGORIES;
  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  protected readonly chipSkeletons = Array.from({ length: CHIP_SKELETON_COUNT });

  protected readonly searchTerm = signal('');
  protected readonly selectedCategory = signal(PODCAST_CATEGORIES[0]);

  protected readonly topPodcasts = signal<Podcast[]>([]);
  protected readonly featuredPodcasts = signal<Podcast[]>([]);
  protected readonly newNoteworthyPodcasts = signal<Podcast[]>([]);
  protected readonly isBrowseLoading = signal(false);
  protected readonly browseError = signal<string | null>(null);

  protected recentSearches: string[] = [];
  protected readonly hasActiveSearch = computed(() => this.searchTerm().trim().length > 0);

  private readonly browseReload$ = new Subject<void>();
  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({
      searchOutline,
      alertCircleOutline,
      refreshOutline,
      timeOutline,
      closeCircleOutline,
      trashOutline,
    });

    this.recentSearches = this.searchHistory.getHistory();

    this.browseReload$
      .pipe(
        tap(() => {
          this.isBrowseLoading.set(true);
          this.browseError.set(null);
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
              this.browseError.set('Could not load podcasts. Please try again.');
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
        this.isBrowseLoading.set(false);
      });

    this.search$
      .pipe(
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((term) => {
          const normalizedTerm = term.trim();
          if (!normalizedTerm) {
            this.store.setQuery('');
            this.store.setSearchResults([], '');
            return of(null);
          }

          this.store.setLoading(true);
          return this.api.searchPodcasts(normalizedTerm, this.countryService.country()).pipe(
            map((results) => ({ term: normalizedTerm, results })),
            catchError(() => {
              this.store.setError('Search failed. Please try again.');
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((payload) => {
        if (payload === null) {
          return;
        }

        this.store.setSearchResults(payload.results, payload.term);
        if (payload.results.length > 0) {
          this.searchHistory.addQuery(payload.term);
          this.recentSearches = this.searchHistory.getHistory();
        }
      });

    this.browseReload$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSearchInput(event: SearchbarCustomEvent): void {
    const term = event.detail.value ?? '';
    this.searchTerm.set(term);
    this.store.setQuery(term);
    this.search$.next(term);
  }

  protected onSearchClear(): void {
    this.searchTerm.set('');
    this.store.setQuery('');
    this.search$.next('');
  }

  protected useRecentSearch(term: string): void {
    this.searchTerm.set(term);
    this.store.setQuery(term);
    if (this.searchbar) this.searchbar.value = term;
    this.search$.next(term);
  }

  protected removeRecentSearch(term: string, event: Event): void {
    event.stopPropagation();
    this.searchHistory.removeQuery(term);
    this.recentSearches = this.searchHistory.getHistory();
  }

  protected clearRecentSearches(): void {
    this.searchHistory.clearAll();
    this.recentSearches = [];
  }

  protected selectCategory(category: PodcastCategory): void {
    if (this.selectedCategory().id === category.id) return;

    this.selectedCategory.set(category);

    if (category.id === 0) {
      this.browseReload$.next();
      return;
    }

    this.router.navigate(['/browse/category', category.id]);
  }

  protected retryBrowse(): void {
    this.browseReload$.next();
  }

  protected retrySearch(): void {
    const query = this.searchTerm().trim();
    if (!query) return;
    this.search$.next(query);
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected async presentCountryPicker(): Promise<void> {
    const currentCode = this.countryService.country();
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Discover by Country',
      buttons: [
        ...PODCAST_MARKETS.map((market) => ({
          text: `${this.countryService.getFlag(market.code)} ${market.name}`,
          cssClass: market.code === currentCode ? 'country-active' : '',
          handler: () => {
            this.countryService.setCountry(market.code);
            this.browseReload$.next();
            if (this.hasActiveSearch()) {
              this.search$.next(this.searchTerm());
            }
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });

    await actionSheet.present();
  }

  protected get currentMarketName(): string {
    const code = this.countryService.country();
    return PODCAST_MARKETS.find((m) => m.code === code)?.name ?? code.toUpperCase();
  }
}
