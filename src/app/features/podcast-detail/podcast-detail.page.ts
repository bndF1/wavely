import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
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
  IonNote,
  IonSkeletonText,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircleOutline, playCircleOutline, refreshOutline } from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PlayerStore } from '../../store/player/player.store';
import { AuthStore } from '../../store/auth/auth.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { Podcast, Episode } from '../../core/models/podcast.model';
import { catchError, forkJoin, of, retry } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'wavely-podcast-detail',
  templateUrl: './podcast-detail.page.html',
  styleUrls: ['./podcast-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
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
    IonNote,
    IonSkeletonText,
    IonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
],
})
export class PodcastDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PodcastApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly podcastsStore = inject(PodcastsStore);
  protected readonly playerStore = inject(PlayerStore);
  private readonly authStore = inject(AuthStore);
  private readonly syncService = inject(SubscriptionSyncService);
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
    addIcons({ checkmarkCircle, addCircleOutline, playCircleOutline, refreshOutline });

    // Stream driven from route params — survives reuse; auto-unsubscribes on destroy
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.isLoading = true;
          this.podcast = null;
          this.allEpisodes = [];
          this.episodes = [];
          this.episodesError = null;
          this.podcastError = null;
          this.hasMoreEpisodes = false;
          return forkJoin({
            podcast: this.api.lookupPodcast(id).pipe(
              retry(2),
              catchError(() => {
                this.podcastError = 'Could not load podcast info.';
                return of(null);
              }),
            ),
            episodes: this.api.getPodcastEpisodes(id, 50).pipe(
              retry(2),
              catchError(() => {
                this.episodesError = 'Could not load episodes.';
                return of([] as Episode[]);
              }),
            ),
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ podcast, episodes }) => {
        this.podcast = podcast;
        this.allEpisodes = episodes;
        this.episodes = episodes.slice(0, PodcastDetailPage.PAGE_SIZE);
        this.hasMoreEpisodes = episodes.length > PodcastDetailPage.PAGE_SIZE;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
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
    this.isLoading = true;
    this.podcast = null;
    this.allEpisodes = [];
    this.episodes = [];
    this.episodesError = null;
    this.podcastError = null;
    this.hasMoreEpisodes = false;
    this.cdr.markForCheck();

    forkJoin({
      podcast: this.api.lookupPodcast(id).pipe(
        retry(2),
        catchError(() => {
          this.podcastError = 'Could not load podcast info.';
          return of(null);
        }),
      ),
      episodes: this.api.getPodcastEpisodes(id, 50).pipe(
        retry(2),
        catchError(() => {
          this.episodesError = 'Could not load episodes.';
          return of([] as Episode[]);
        }),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ podcast, episodes }) => {
        this.podcast = podcast;
        this.allEpisodes = episodes;
        this.episodes = episodes.slice(0, PodcastDetailPage.PAGE_SIZE);
        this.hasMoreEpisodes = episodes.length > PodcastDetailPage.PAGE_SIZE;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
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
    // Queue from allEpisodes so episodes not yet loaded in the infinite scroll are included
    const idx = this.allEpisodes.findIndex((e) => e.id === episode.id);
    const upcoming = this.allEpisodes.slice(idx + 1);
    this.playerStore.clearQueue();
    upcoming.forEach((e) => this.playerStore.addToQueue({ ...e, podcastTitle }));
    this.playerStore.play({ ...episode, podcastTitle });
    // Navigate to episode detail, passing full objects via router state to avoid extra API calls
    this.router.navigate(['/episode', episode.id], {
      state: { episode: { ...episode, podcastTitle }, podcast: this.podcast },
    });
  }

  protected formatDuration(seconds: number): string {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
    return `${s}s`;
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
