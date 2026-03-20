import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { PlayerModalService } from '../../core/services/player-modal.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

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
  IonThumbnail,
  IonList,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  refreshOutline,
  searchOutline,
  sparklesOutline,
  chevronDownOutline,
  radioOutline,
} from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { CountryService } from '../../core/services/country.service';
import { PlayerStore } from '../../store/player/player.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { Episode, Podcast } from '../../core/models/podcast.model';
import { RadioStation } from '../../core/models/radio-station.model';
import { radioStationToEpisode } from '../../core/services/radio-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { EpisodeItemComponent } from '../../shared/components/episode-item/episode-item.component';
import { TranslatePipe } from '@ngx-translate/core';

const SKELETON_COUNT = 6;
const FEED_LIMIT_PER_PODCAST = 20;
const FEED_PAGE_SIZE = 30;
const FEED_MAX_AGE_DAYS = 30;

@Component({
  selector: 'wavely-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
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
    IonThumbnail,
    IonList,
    PodcastCardComponent,
    EmptyStateComponent,
    EpisodeItemComponent,
    TranslatePipe,
  ],
})
export class HomePage implements OnInit {
  private readonly api = inject(PodcastApiService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);
  private readonly playerModal = inject(PlayerModalService);
  private readonly countryService = inject(CountryService);
  private readonly playerStore = inject(PlayerStore);
  protected readonly prefs = inject(UserPreferencesService);

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
  /** Comma-separated sorted IDs of subscriptions used for the last feed load */
  private readonly lastLoadedSubIds = signal('');
  private readonly displayCount = signal(FEED_PAGE_SIZE);
  /** Set when a force=true loadFeed() arrives while a load is already in-flight.
   *  Checked at load completion to immediately trigger a follow-up fetch (#253/#240). */
  private pendingFeedRefresh = false;

  protected readonly feedEpisodes = computed(() => {
    const cutoff = Date.now() - FEED_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    // Filter by publish date only — listening history is independent of the feed
    // (fixes #256: clearing history must not resurface episodes already shown as new)
    return this.allFeedEpisodes()
      .filter((ep) => !ep.releaseDate || new Date(ep.releaseDate).getTime() >= cutoff)
      .slice(0, this.displayCount());
  });
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
      radioOutline,
    });

    // Reload feed whenever the set of subscriptions changes (handles new subscriptions added later).
    // #240: use untracked() to read lastLoadedSubIds without creating a reactive dependency so
    // this effect only re-runs when subscriptions change, not when lastLoadedSubIds changes.
    // loadFeed() records the loaded sub IDs itself, preventing duplicate fetches.
    effect(() => {
      const subs = this.store.subscriptions();
      const subIds = subs.map((s) => s.id).sort().join(',');
      if (subs.length > 0 && subIds !== untracked(() => this.lastLoadedSubIds())) {
        void this.loadFeed(true);
      }
    });
  }

  ngOnInit(): void {
    if (this.store.trending().length === 0) {
      this.loadTrending();
    }
  }

  ionViewWillEnter(): void {
    // Guard is intentional: when the subscription-change effect has already triggered
    // a load (isFeedLoading = true), starting a second concurrent fetch is wasteful —
    // the in-flight request already has the latest subscription IDs.
    // loadFeed() snapshots lastLoadedSubIds immediately, so the effect will not
    // queue a duplicate fetch once this call starts (#240/#253).
    if (!this.isFeedLoading()) {
      void this.loadFeed(true);
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
    void this.playerModal.open();
  }

  protected queueEpisode(episode: Episode): void {
    this.playerStore.addToQueue(episode);
  }

  protected playStation(station: RadioStation): void {
    this.playerStore.play(radioStationToEpisode(station));
    void this.playerModal.open();
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
    if (this.isFeedLoading()) {
      // Queue a follow-up load so subscription changes arriving mid-flight aren't dropped.
      if (force) this.pendingFeedRefresh = true;
      return Promise.resolve();
    }
    this.pendingFeedRefresh = false;

    // Snapshot the subscription IDs being loaded immediately so the subscription-change
    // effect does not queue a duplicate fetch while this request is in flight (#240/#253).
    this.lastLoadedSubIds.set(subs.map((s) => s.id).sort().join(','));

    this.isFeedLoading.set(true);
    this.feedError.set(null);
    this.displayCount.set(FEED_PAGE_SIZE);

    return new Promise((resolve) => {
      const requests = subs.map((podcast) => {
        if (podcast.feedUrl) {
          return this.api.getEpisodesFromRss(podcast.feedUrl, podcast.id).pipe(
            map((eps) => eps.slice(0, FEED_LIMIT_PER_PODCAST)),
            // Enrich RSS episodes with podcastTitle (not set by RSS parser)
            map((eps) => eps.map((ep) => ({ ...ep, podcastTitle: ep.podcastTitle ?? podcast.title }))),
            // Fall back to iTunes when RSS returns no episodes (e.g. CORS/proxy block)
            switchMap((eps) =>
              eps.length > 0
                ? of(eps)
                : this.api.getPodcastEpisodes(podcast.id, FEED_LIMIT_PER_PODCAST).pipe(
                    catchError(() => of([] as Episode[])),
                  ),
            ),
            catchError(() =>
              this.api.getPodcastEpisodes(podcast.id, FEED_LIMIT_PER_PODCAST).pipe(
                catchError(() => of([] as Episode[])),
              ),
            ),
          );
        }
        return this.api.getPodcastEpisodes(podcast.id, FEED_LIMIT_PER_PODCAST).pipe(
          catchError(() => of([] as Episode[])),
        );
      });

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
          }
          this.isFeedLoading.set(false);
          resolve();
          if (this.pendingFeedRefresh) void this.loadFeed(true);
        },
        error: () => {
          this.feedError.set('Could not load episodes. Pull down to retry.');
          this.isFeedLoading.set(false);
          resolve();
          if (this.pendingFeedRefresh) void this.loadFeed(true);
        },
      });
    });
  }
}
