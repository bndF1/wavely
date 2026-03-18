import { Component, inject, output } from '@angular/core';

import {
  IonThumbnail,
  IonButton,
  IonIcon,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, pauseCircle, closeCircle } from 'ionicons/icons';
import { PlayerStore } from '../../../store/player/player.store';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'wavely-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss'],
  imports: [IonThumbnail, IonButton, IonIcon, IonProgressBar, TranslatePipe],
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
