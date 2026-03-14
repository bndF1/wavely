import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
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
  IonRange,
  IonLabel,
  IonSkeletonText,
  IonText,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  playCircle,
  pauseCircle,
  playSkipForward,
  playSkipBack,
  addOutline,
} from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PlayerStore } from '../../store/player/player.store';
import { Episode, Podcast } from '../../core/models/podcast.model';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Episode Detail Page
 *
 * Data strategy (in priority order):
 * 1. Router navigation state (`episode` + `podcast` objects) — fastest, no network
 * 2. Current PlayerStore episode (if IDs match) + podcast lookup
 * 3. Fallback: load episode list from podcast (requires podcastId in route state)
 */
@Component({
  selector: 'wavely-episode-detail',
  templateUrl: './episode-detail.page.html',
  styleUrls: ['./episode-detail.page.scss'],
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
    IonRange,
    IonLabel,
    IonSkeletonText,
    IonText,
    IonSelect,
    IonSelectOption
],
})
export class EpisodeDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PodcastApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly playerStore = inject(PlayerStore);

  // Signals for local state — reactive under OnPush
  protected readonly episode = signal<Episode | null>(null);
  protected readonly podcast = signal<Podcast | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  readonly playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  constructor() {
    addIcons({ playCircle, pauseCircle, playSkipForward, playSkipBack, addOutline });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const episodeId = params.get('id') ?? '';
          this.isLoading.set(true);
          this.episode.set(null);
          this.podcast.set(null);
          this.error.set(null);

          // Strategy 1: router state carries full objects (set by PodcastDetailPage)
          const navState = history.state as { episode?: Episode; podcast?: Podcast };
          if (navState?.episode?.id === episodeId) {
            this.episode.set(navState.episode);
            this.podcast.set(navState.podcast ?? null);
            this.isLoading.set(false);
            return of(null);
          }

          // Strategy 2: already loaded in player store
          const current = this.playerStore.currentEpisode();
          if (current?.id === episodeId) {
            return this.api.lookupPodcast(current.podcastId).pipe(
              catchError(() => of(null)),
              switchMap((pod) => {
                this.episode.set(current);
                this.podcast.set(pod);
                this.isLoading.set(false);
                return of(null);
              }),
            );
          }

          // Strategy 3: if router state has the podcastId but not full episode
          const podcastId = navState?.podcast?.id;
          if (podcastId) {
            return forkJoin({
              episodes: this.api.getPodcastEpisodes(podcastId, 50).pipe(
                catchError(() => of([] as Episode[])),
              ),
              podcast: this.api.lookupPodcast(podcastId).pipe(
                catchError(() => of(null as Podcast | null)),
              ),
            }).pipe(
              switchMap(({ episodes, podcast }) => {
                const ep = episodes.find((e) => e.id === episodeId) ?? null;
                if (!ep) this.error.set('Episode not found.');
                this.episode.set(ep);
                this.podcast.set(podcast);
                this.isLoading.set(false);
                return of(null);
              }),
            );
          }

          // No data available to load this episode
          this.error.set('Navigate to an episode from the podcast page.');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected get isCurrentlyPlaying(): boolean {
    const ep = this.playerStore.currentEpisode();
    const epId = this.episode()?.id;
    return epId != null && ep?.id === epId && this.playerStore.isPlaying();
  }

  protected togglePlayPause(): void {
    const ep = this.episode();
    if (!ep) return;
    if (this.isCurrentlyPlaying) {
      this.playerStore.pause();
    } else if (this.playerStore.currentEpisode()?.id === ep.id) {
      this.playerStore.resume();
    } else {
      this.playerStore.play(ep);
    }
  }

  protected seekTo(value: number): void {
    this.playerStore.seek(value);
  }

  protected formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  protected skipForward(): void {
    this.playerStore.skipForward(30);
  }

  protected skipBack(): void {
    this.playerStore.skipBack(30);
  }

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-artwork.svg';
  }

  protected goToPodcast(): void {
    const pod = this.podcast();
    if (pod) this.router.navigate(['/podcast', pod.id]);
  }

  protected get isInQueue(): boolean {
    const ep = this.episode();
    return ep ? this.playerStore.queue().some((q) => q.id === ep.id) : false;
  }

  protected addToQueue(): void {
    const ep = this.episode();
    const pod = this.podcast();
    if (ep) this.playerStore.addToQueue({ ...ep, podcastTitle: pod?.title });
  }
}
