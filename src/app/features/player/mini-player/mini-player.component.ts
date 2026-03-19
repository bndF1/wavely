import { Component, inject, output } from '@angular/core';

import {
  IonThumbnail,
  IonButton,
  IonIcon,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, pauseCircle, closeCircle, playSkipBack, playSkipForward } from 'ionicons/icons';
import { PlayerStore } from '../../../store/player/player.store';
import { TranslatePipe } from '@ngx-translate/core';
import { PlayerModalService } from '../../../core/services/player-modal.service';

@Component({
  selector: 'wavely-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss'],
  imports: [IonThumbnail, IonButton, IonIcon, IonProgressBar, TranslatePipe],
})
export class MiniPlayerComponent {
  readonly store = inject(PlayerStore);
  private readonly playerModal = inject(PlayerModalService);

  /** Emitted when user taps the player body — parent opens full player */
  readonly openFull = output<void>();

  constructor() {
    addIcons({ playCircle, pauseCircle, closeCircle, playSkipBack, playSkipForward });
  }

  get progressValue(): number {
    const dur = this.store.duration();
    return dur > 0 ? this.store.currentTime() / dur : 0;
  }

  get isDesktop(): boolean {
    return this.playerModal.isDesktop;
  }

  handleBodyClick(): void {
    if (!this.isDesktop) {
      this.openFull.emit();
    }
  }

  skipBack(event: Event): void {
    event.stopPropagation();
    this.store.skipBack(15);
  }

  skipForward(event: Event): void {
    event.stopPropagation();
    this.store.skipForward(30);
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
