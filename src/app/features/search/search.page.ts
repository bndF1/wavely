import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonThumbnail,
  IonChip,
  IonIcon,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil, catchError, map } from 'rxjs';
import { addIcons } from 'ionicons';
import { alertCircleOutline, closeCircleOutline, refreshOutline, searchOutline, timeOutline, trashOutline } from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { SearchHistoryService } from '../../core/services/search-history.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { Podcast } from '../../core/models/podcast.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

const SKELETON_COUNT = 6;
const DEBOUNCE_MS = 300;

@Component({
  selector: 'wavely-search',
  standalone: true,
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonThumbnail,
    IonChip,
    IonIcon,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class SearchPage implements OnDestroy {
  @ViewChild(IonSearchbar) private searchbar?: IonSearchbar;

  private readonly api = inject(PodcastApiService);
  private readonly searchHistory = inject(SearchHistoryService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  protected readonly skeletonPodcast: Podcast = { id: '', title: '', author: '', description: '', artworkUrl: '', feedUrl: '', genres: [] };
  protected readonly detectedCountry: string;
  protected globalSearch = false;
  protected displayQuery = '';
  protected isSearchFocused = false;
  protected recentSearches: string[] = [];

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.detectedCountry = this.api.detectCountry();
    this.recentSearches = this.searchHistory.getHistory();
    addIcons({
      searchOutline,
      alertCircleOutline,
      refreshOutline,
      timeOutline,
      closeCircleOutline,
      trashOutline,
    });

    this.search$.pipe(
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
        const country = this.globalSearch ? undefined : this.detectedCountry;

        return this.api.searchPodcasts(normalizedTerm, country).pipe(
          map((results) => ({ term: normalizedTerm, results })),
          catchError(() => {
            this.store.setError('Search failed. Please try again.');
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((payload) => {
      if (payload === null) {
        return;
      }

      this.store.setSearchResults(payload.results, payload.term);
      if (payload.results.length > 0) {
        this.searchHistory.addQuery(payload.term);
        this.recentSearches = this.searchHistory.getHistory();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSearchInput(event: SearchbarCustomEvent): void {
    const term = event.detail.value ?? '';
    this.displayQuery = term;
    this.store.setQuery(term);
    this.search$.next(term);
  }

  protected onSearchFocus(): void {
    this.isSearchFocused = true;
    this.recentSearches = this.searchHistory.getHistory();
  }

  protected onSearchBlur(): void {
    this.isSearchFocused = false;
  }

  protected onSearchClear(): void {
    this.displayQuery = '';
    this.search$.next('');
  }

  protected useSuggestion(term: string): void {
    this.displayQuery = term;
    this.store.setQuery(term);
    this.searchbar?.value = term;
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

  protected shouldShowSuggestions(): boolean {
    return this.isSearchFocused && !this.displayQuery.trim() && this.recentSearches.length > 0;
  }

  protected toggleGlobalSearch(): void {
    this.globalSearch = !this.globalSearch;
    if (this.displayQuery.trim()) {
      this.search$.next(this.displayQuery);
    }
  }

  protected retrySearch(): void {
    const query = this.store.searchQuery();
    if (!query.trim()) return;
    this.search$.next(query);
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
