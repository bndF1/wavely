import { DatePipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { IonButton, IonIcon, IonItem, IonLabel, IonNote, IonThumbnail } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, checkmarkOutline, playCircleOutline } from 'ionicons/icons';

import { Episode } from '../../../core/models/podcast.model';

@Component({
  selector: 'wavely-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
  imports: [DatePipe, IonItem, IonThumbnail, IonLabel, IonNote, IonButton, IonIcon],
})
export class EpisodeItemComponent {
  readonly episode = input.required<Episode>();
  readonly podcastTitle = input<string | null | undefined>(undefined);
  readonly showPodcastTitle = input<boolean>(true);
  readonly showReleaseDate = input<boolean>(true);
  readonly showDuration = input<boolean>(false);

  readonly episodePlay = output<Episode>();
  readonly addToQueue = output<Episode>();

  protected readonly justAdded = signal(false);

  constructor() {
    addIcons({ playCircleOutline, addOutline, checkmarkOutline });
  }

  protected emitPlay(): void {
    this.episodePlay.emit(this.episode());
  }

  protected emitQueue(event: Event): void {
    event.stopPropagation();
    this.addToQueue.emit(this.episode());
    this.justAdded.set(true);
    setTimeout(() => this.justAdded.set(false), 1500);
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
