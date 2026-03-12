import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
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
    FormsModule,
    NgFor,
    NgIf,
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

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
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
          // Bind the originating term alongside results to avoid stale-query race
          return this.api.searchPodcasts(term).pipe(
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
    this.store.setQuery(term);
    this.search$.next(term);
  }

  protected onSearchClear(): void {
    // Emit empty string immediately so switchMap cancels any in-flight request
    this.search$.next('');
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }
}
