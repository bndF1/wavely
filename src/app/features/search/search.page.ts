import { Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonText,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  takeUntil,
  catchError,
  map,
} from 'rxjs';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { Podcast } from '../../core/models/podcast.model';

const SKELETON_COUNT = 6;
const DEBOUNCE_MS = 300;

@Component({
  selector: 'wavely-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonText,
    PodcastCardComponent,
  ],
})
export class SearchPage implements OnDestroy {
  private readonly api = inject(PodcastApiService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  protected readonly skeletonPodcast: Podcast = {
    id: '', title: '', author: '', description: '', artworkUrl: '', feedUrl: '', genres: [],
  };

  /** The ISO country code detected from the browser locale (e.g. "es", "us"). */
  protected readonly detectedCountry: string;
  /** When true, pass no country to iTunes so it searches all stores globally. */
  protected globalSearch = false;
  /**
   * Tracks what the user has typed. This is the *display* value shown in
   * no-results / idle messages. It is NOT fed back into ion-searchbar to
   * avoid the controlled-input cycle that drops characters.
   */
  protected displayQuery = '';

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.detectedCountry = this.api.detectCountry();

    this.search$
      .pipe(
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term.trim()) {
            this.store.setSearchResults([], '');
            return of(null);
          }
          this.store.setLoading(true);
          const country = this.globalSearch ? undefined : this.detectedCountry;
          // Bind the originating term alongside results to avoid stale-query race
          return this.api.searchPodcasts(term, country).pipe(
            map((results) => ({ term, results })),
            // catchError inside switchMap keeps the outer stream alive after failures
            catchError(() => {
              this.store.setError('Search failed. Please try again.');
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((payload) => {
        if (payload !== null) {
          this.store.setSearchResults(payload.results, payload.term);
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

  protected onSearchClear(): void {
    this.displayQuery = '';
    // Emit empty string immediately so switchMap cancels any in-flight request
    this.search$.next('');
  }

  protected toggleGlobalSearch(): void {
    this.globalSearch = !this.globalSearch;
    // Re-run the current query with the new scope
    if (this.displayQuery.trim()) {
      this.search$.next(this.displayQuery);
    }
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  /** Returns the flag emoji for the detected country (e.g. 🇪🇸 for "es"). */
  protected get countryFlag(): string {
    return this.detectedCountry
      .toUpperCase()
      .split('')
      .map((c) => String.fromCodePoint(0x1f1a5 + c.charCodeAt(0)))
      .join('');
  }
}
