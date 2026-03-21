import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircleOutline, refreshOutline, arrowBackOutline } from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { CountryService } from '../../core/services/country.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PlayerStore } from '../../store/player/player.store';
import { AuthStore } from '../../store/auth/auth.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { PlayerModalService } from '../../core/services/player-modal.service';
import { Podcast, Episode } from '../../core/models/podcast.model';
import { Observable, catchError, of, retry } from 'rxjs';
import { EpisodeItemComponent } from '../../shared/components/episode-item/episode-item.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'wavely-podcast-detail',
  templateUrl: './podcast-detail.page.html',
  styleUrls: ['./podcast-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    EpisodeItemComponent,
    TranslatePipe,
  ],
})
export class PodcastDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PodcastApiService);
  private readonly countryService = inject(CountryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly playerModal = inject(PlayerModalService);
  protected readonly podcastsStore = inject(PodcastsStore);
  protected readonly playerStore = inject(PlayerStore);
  private readonly authStore = inject(AuthStore);
  private readonly syncService = inject(SubscriptionSyncService);
  private readonly prefs = inject(UserPreferencesService);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly PAGE_SIZE = 15;

  protected podcast: Podcast | null = null;
  // All fetched episodes — the source of truth
  private allEpisodes: Episode[] = [];
  // Slice shown in the template — grows as user scrolls
  protected episodes: Episode[] = [];
  protected isLoading = true;
  protected episodesError: string | null = null;
  protected podcastError: string | null = null;
  protected hasMoreEpisodes = false;

  constructor() {
    addIcons({ checkmarkCircle, addCircleOutline, refreshOutline, arrowBackOutline });

    // Stream driven from route params — survives reuse; auto-unsubscribes on destroy
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.resetState();
          return this.loadPodcastData(id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ podcast, episodes }) => this.applyData(podcast, episodes));
  }

  protected goBack(): void {
    this.location.back();
  }

  private resetState(): void {
    this.isLoading = true;
    this.podcast = null;
    this.allEpisodes = [];
    this.episodes = [];
    this.episodesError = null;
    this.podcastError = null;
    this.hasMoreEpisodes = false;
  }

  private applyData(podcast: Podcast | null, episodes: Episode[]): void {
    this.podcast = podcast;
    this.allEpisodes = episodes;
    this.episodes = episodes.slice(0, PodcastDetailPage.PAGE_SIZE);
    this.hasMoreEpisodes = episodes.length > PodcastDetailPage.PAGE_SIZE;
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  /**
   * Loads podcast metadata first, then fetches episodes.
   * Episode strategy: RSS feed (full history) → iTunes fallback (≤200 recent).
   * A 1 s delay between retries avoids triggering iTunes rate limiting.
   */
  private loadPodcastData(id: string): Observable<{ podcast: Podcast | null; episodes: Episode[] }> {
    return this.api.lookupPodcast(id, this.countryService.country()).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(() => {
        this.podcastError = 'Could not load podcast info.';
        return of(null as Podcast | null);
      }),
      switchMap((podcast) => {
        const feedUrl = podcast?.feedUrl;
        const episodes$ = feedUrl
          ? this.api.getEpisodesFromRss(feedUrl, id).pipe(
              switchMap((rssEpisodes) =>
                rssEpisodes.length > 0 ? of(rssEpisodes) : this.itunesEpisodes(id),
              ),
            )
          : this.itunesEpisodes(id);

        return episodes$.pipe(map((episodes) => ({ podcast, episodes })));
      }),
    );
  }

  private itunesEpisodes(id: string): Observable<Episode[]> {
    return this.api.getPodcastEpisodes(id, 200, this.countryService.country()).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(() => {
        this.episodesError = 'Could not load episodes.';
        return of([] as Episode[]);
      }),
    );
  }

  protected loadMoreEpisodes(event: InfiniteScrollCustomEvent): void {
    const current = this.episodes.length;
    const next = this.allEpisodes.slice(current, current + PodcastDetailPage.PAGE_SIZE);
    this.episodes = [...this.episodes, ...next];
    this.hasMoreEpisodes = this.episodes.length < this.allEpisodes.length;
    this.cdr.markForCheck();
    event.target.complete();
  }

  protected retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.resetState();
    this.cdr.markForCheck();
    this.loadPodcastData(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ podcast, episodes }) => this.applyData(podcast, episodes));
  }

  protected get isSubscribed(): boolean {
    return this.podcast
      ? this.podcastsStore.subscriptions().some((p) => p.id === this.podcast!.id)
      : false;
  }

  protected toggleSubscription(): void {
    if (!this.podcast) return;
    const uid = this.authStore.user()?.uid ?? null;
    if (this.isSubscribed) {
      this.syncService.removeSubscription(this.podcast.id, uid);
    } else {
      this.syncService.addSubscription(this.podcast, uid);
    }
    // Force synchronous change detection for the optimistic UI update.
    // addSubscription() is async (await setDoc) — Zone.js delays tick() until
    // the Firestore write resolves. Using detectChanges() ensures the button
    // shows "Subscribed" immediately, before the network call completes.
    this.cdr.detectChanges();
  }

  protected playEpisode(episode: Episode): void {
    if (!this.podcast) return;
    const podcastTitle = this.podcast.title;
    this.playerStore.clearQueue();
    if (this.prefs.autoQueueEnabled()) {
      // Queue from allEpisodes so episodes not yet loaded in the infinite scroll are included
      const idx = this.allEpisodes.findIndex((e) => e.id === episode.id);
      const upcoming = this.allEpisodes.slice(idx + 1);
      upcoming.forEach((e) => this.playerStore.addToQueue({ ...e, podcastTitle }));
    }
    this.playerStore.play({ ...episode, podcastTitle });
    void this.playerModal.open();
  }

  protected queueEpisode(episode: Episode): void {
    if (!this.podcast) return;
    this.playerStore.addToQueue({ ...episode, podcastTitle: this.podcast.title });
  }

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-artwork.svg';
  }

  protected navigateToPublisher(): void {
    if (this.podcast?.artistId) {
      this.router.navigate(['/publisher', this.podcast.artistId]);
    }
  }
}
