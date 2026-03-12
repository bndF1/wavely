import { Component, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { Podcast } from '../../../core/models/podcast.model';

@Component({
  selector: 'wavely-podcast-card',
  templateUrl: './podcast-card.component.html',
  styleUrls: ['./podcast-card.component.scss'],
  imports: [NgIf],
})
export class PodcastCardComponent {
  readonly podcast = input.required<Podcast>();
  /** Emitted when the card is tapped */
  readonly cardClick = output<Podcast>();

  /** Show skeleton loading state instead of content */
  readonly loading = input<boolean>(false);

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/default-artwork.svg';
  }

  onSpaceKey(event: Event): void {
    if (this.loading()) return;
    event.preventDefault();
    this.cardClick.emit(this.podcast());
  }
}
