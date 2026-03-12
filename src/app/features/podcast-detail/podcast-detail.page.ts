import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, NgFor, NgIf } from '@angular/common';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, addCircleOutline, playCircleOutline } from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PlayerStore } from '../../store/player/player.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { Podcast, Episode } from '../../core/models/podcast.model';
import { catchError, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'wavely-podcast-detail',
  templateUrl: './podcast-detail.page.html',
  styleUrls: ['./podcast-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgFor,
    NgIf,
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
  ],
})
export class PodcastDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PodcastApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly podcastsStore = inject(PodcastsStore);
  protected readonly playerStore = inject(PlayerStore);
  private readonly syncService = inject(SubscriptionSyncService);

  protected podcast: Podcast | null = null;
  protected episodes: Episode[] = [];
  protected isLoading = true;
  protected episodesError: string | null = null;
  protected podcastError: string | null = null;

  constructor() {
    addIcons({ checkmarkCircle, addCircleOutline, playCircleOutline });

    // Stream driven from route params — survives reuse; auto-unsubscribes on destroy
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.isLoading = true;
          this.podcast = null;
          this.episodes = [];
          this.episodesError = null;
          this.podcastError = null;
          return forkJoin({
            podcast: this.api.lookupPodcast(id).pipe(
              catchError(() => {
                this.podcastError = 'Could not load podcast info.';
                return of(null);
              }),
            ),
            episodes: this.api.getPodcastEpisodes(id, 50).pipe(
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
        this.episodes = episodes;
        this.isLoading = false;
      });
  }

  protected get isSubscribed(): boolean {
    return this.podcast
      ? this.podcastsStore.subscriptions().some((p) => p.id === this.podcast!.id)
      : false;
  }

  protected toggleSubscription(): void {
    if (!this.podcast) return;
    if (this.isSubscribed) {
      this.syncService.remove(this.podcast.id);
    } else {
      this.syncService.add(this.podcast);
    }
  }

  protected playEpisode(episode: Episode): void {
    if (!this.podcast) return;
    // Set the clicked episode as current, queue the rest that follow it
    const idx = this.episodes.findIndex((e) => e.id === episode.id);
    const upcoming = this.episodes.slice(idx + 1);
    this.playerStore.clearQueue();
    upcoming.forEach((e) => this.playerStore.addToQueue(e));
    this.playerStore.play(episode);
    // Navigate to episode detail, passing full objects via router state to avoid extra API calls
    this.router.navigate(['/episode', episode.id], {
      state: { episode, podcast: this.podcast },
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
}
