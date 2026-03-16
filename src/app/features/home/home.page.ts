import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  IonItem,
  IonLabel,
  IonNote,
  IonThumbnail,
  IonList,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  refreshOutline,
  searchOutline,
  sparklesOutline,
  chevronDownOutline,
  playCircleOutline,
} from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { CountryService } from '../../core/services/country.service';
import { PlayerStore } from '../../store/player/player.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { Episode, Podcast } from '../../core/models/podcast.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

const SKELETON_COUNT = 6;
const FEED_LIMIT_PER_PODCAST = 10;
const FEED_PAGE_SIZE = 30;

@Component({
  selector: 'wavely-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSkeletonText,
    IonItem,
    IonLabel,
    IonNote,
    IonThumbnail,
    IonList,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class HomePage implements OnInit {
  private readonly api = inject(PodcastApiService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);
  private readonly countryService = inject(CountryService);
  private readonly playerStore = inject(PlayerStore);
  private readonly prefs = inject(UserPreferencesService);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  protected readonly feedSkeletons = Array.from({ length: 5 });

  protected readonly skeletonPodcast: Podcast = {
    id: '',
    title: '',
    author: '',
    description: '',
    artworkUrl: '',
    feedUrl: '',
    genres: [],
  };

  // Episode feed state
  private readonly allFeedEpisodes = signal<Episode[]>([]);
  protected readonly isFeedLoading = signal(false);
  protected readonly feedError = signal<string | null>(null);
  private readonly feedLoaded = signal(false);
  private readonly displayCount = signal(FEED_PAGE_SIZE);

  protected readonly feedEpisodes = computed(() =>
    this.allFeedEpisodes().slice(0, this.displayCount())
  );
  protected readonly hasMoreFeed = computed(
    () => this.displayCount() < this.allFeedEpisodes().length
  );
  protected readonly hiddenFeedCount = computed(() =>
    Math.min(FEED_PAGE_SIZE, this.allFeedEpisodes().length - this.displayCount())
  );

  constructor() {
    addIcons({
      searchOutline,
      refreshOutline,
      alertCircleOutline,
      sparklesOutline,
      chevronDownOutline,
      playCircleOutline,
    });

    // Reactively load feed when subscriptions become available (handles async Firestore sync)
    effect(() => {
      const subs = this.store.subscriptions();
      if (subs.length > 0 && !this.feedLoaded()) {
        void this.loadFeed();
      }
    });
  }

  ngOnInit(): void {
    if (this.store.trending().length === 0) {
      this.loadTrending();
    }
  }

  protected async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    await Promise.all([this.loadTrending(), this.loadFeed(true)]);
    event.detail.complete();
  }

  protected retryTrending(): void {
    void this.loadTrending();
  }

  protected retryFeed(): void {
    void this.loadFeed(true);
  }

  protected loadMoreFeed(): void {
    this.displayCount.update((c) => c + FEED_PAGE_SIZE);
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected navigateToSearch(): void {
    this.router.navigate(['/tabs/discover']);
  }

  protected navigateToBrowse(): void {
    this.router.navigate(['/tabs/discover']);
  }

  protected playEpisode(episode: Episode): void {
    this.playerStore.clearQueue();
    if (this.prefs.autoQueueEnabled()) {
      const idx = this.allFeedEpisodes().findIndex((e) => e.id === episode.id);
      this.allFeedEpisodes()
        .slice(idx + 1)
        .forEach((e) => this.playerStore.addToQueue(e));
    }
    this.playerStore.play(episode);
    const podcast = this.store.subscriptions().find((p) => p.id === episode.podcastId);
    this.router.navigate(['/episode', episode.id], { state: { episode, podcast } });
  }

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-artwork.svg';
  }

  private loadTrending(): Promise<void> {
    this.store.setLoading(true);
    return new Promise((resolve) => {
      this.api.getTrendingPodcasts(25, undefined, this.countryService.country()).subscribe({
        next: (podcasts) => {
          this.store.setTrending(podcasts);
          this.store.setLoading(false);
          resolve();
        },
        error: () => {
          this.store.setError('Could not load trending podcasts. Pull down to retry.');
          resolve();
        },
      });
    });
  }

  private loadFeed(force = false): Promise<void> {
    const subs = this.store.subscriptions();
    if (subs.length === 0) return Promise.resolve();
    if (this.feedLoaded() && !force) return Promise.resolve();

    this.isFeedLoading.set(true);
    this.feedError.set(null);
    this.displayCount.set(FEED_PAGE_SIZE);

    return new Promise((resolve) => {
      const requests = subs.map((podcast) =>
        this.api.getPodcastEpisodes(podcast.id, FEED_LIMIT_PER_PODCAST).pipe(
          catchError(() => of([] as Episode[])),
        )
      );

      forkJoin(requests).subscribe({
        next: (results) => {
          const episodes: Episode[] = results
            .flat()
            .sort((a, b) => {
              const ta = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
              const tb = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
              return tb - ta;
            });

          if (episodes.length === 0 && results.every((r) => r.length === 0)) {
            this.feedError.set('Could not load episodes. Pull down to retry.');
          } else {
            this.allFeedEpisodes.set(episodes);
            this.feedLoaded.set(true);
          }
          this.isFeedLoading.set(false);
          resolve();
        },
        error: () => {
          this.feedError.set('Could not load episodes. Pull down to retry.');
          this.isFeedLoading.set(false);
          resolve();
        },
      });
    });
  }
}
