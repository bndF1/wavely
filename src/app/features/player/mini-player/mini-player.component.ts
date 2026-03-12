import { Component, inject, output } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  IonThumbnail,
  IonButton,
  IonIcon,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, pauseCircle, closeCircle } from 'ionicons/icons';
import { PlayerStore } from '../../../store/player/player.store';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'wavely-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss'],
  imports: [NgIf, IonThumbnail, IonButton, IonIcon, IonProgressBar],
})
export class MiniPlayerComponent {
  readonly store = inject(PlayerStore);

  /** Emitted when user taps the player body — parent opens full player */
  readonly openFull = output<void>();

  constructor() {
    addIcons({ playCircle, pauseCircle, closeCircle });
  }

  get progressValue(): number {
    const dur = this.store.duration();
    return dur > 0 ? this.store.currentTime() / dur : 0;
  }

  togglePlay(event: Event): void {
    event.stopPropagation();
    if (this.store.isPlaying()) {
      this.store.pause();
    } else {
      this.store.resume();
    }
  }

  close(event: Event): void {
    event.stopPropagation();
    this.store.close();
  }
}
