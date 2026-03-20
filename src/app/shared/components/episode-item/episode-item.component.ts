import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, input, output, signal } from '@angular/core';
import { IonButton, IonIcon, IonItem, IonLabel, IonNote, IonThumbnail } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, checkmarkOutline, playCircleOutline } from 'ionicons/icons';

import { Episode } from '../../../core/models/podcast.model';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'wavely-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IonItem, IonThumbnail, IonLabel, IonNote, IonButton, IonIcon, TranslatePipe],
})
export class EpisodeItemComponent implements OnDestroy {
  readonly episode = input.required<Episode>();
  readonly podcastTitle = input<string | null | undefined>(undefined);
  readonly showPodcastTitle = input<boolean>(true);
  readonly showReleaseDate = input<boolean>(true);
  readonly showDuration = input<boolean>(false);

  readonly episodePlay = output<Episode>();
  readonly addToQueue = output<Episode>();

  protected readonly justAdded = signal(false);
  private justAddedTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    addIcons({ playCircleOutline, addOutline, checkmarkOutline });
  }

  ngOnDestroy(): void {
    if (this.justAddedTimer !== null) {
      clearTimeout(this.justAddedTimer);
    }
  }

  protected emitPlay(): void {
    this.episodePlay.emit(this.episode());
  }

  protected emitQueue(event: Event): void {
    event.stopPropagation();
    this.addToQueue.emit(this.episode());
    if (this.justAddedTimer !== null) {
      clearTimeout(this.justAddedTimer);
    }
    this.justAdded.set(true);
    this.justAddedTimer = setTimeout(() => {
      this.justAdded.set(false);
      this.justAddedTimer = null;
    }, 2000);
  }

  protected formatDuration(seconds: number): string {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
    return `${s}s`;
  }

  protected displayPodcastTitle(): string | null {
    return this.podcastTitle() ?? this.episode().podcastTitle ?? null;
  }

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-artwork.svg';
  }
}
