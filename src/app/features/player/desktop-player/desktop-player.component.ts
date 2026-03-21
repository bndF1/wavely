import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  playCircle,
  pauseCircle,
  closeCircle,
  playSkipBack,
  playSkipForward,
  volumeHigh,
  volumeMute,
  list,
  closeOutline,
} from 'ionicons/icons';
import { PlayerStore } from '../../../store/player/player.store';
import { AudioService } from '../../../core/services/audio.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'wavely-desktop-player',
  templateUrl: './desktop-player.component.html',
  styleUrls: ['./desktop-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, IonButton, NgClass, TranslatePipe],
})
export class DesktopPlayerComponent {
  readonly store = inject(PlayerStore);

  constructor() {
    addIcons({
      playCircle,
      pauseCircle,
      closeCircle,
      playSkipBack,
      playSkipForward,
      volumeHigh,
      volumeMute,
      list,
      closeOutline,
    });
  }

  get progressValue(): number {
    const dur = this.store.duration();
    return dur > 0 ? this.store.currentTime() / dur : 0;
  }

  get currentTimeFormatted(): string {
    return AudioService.formatTime(this.store.currentTime());
  }

  get remainingTimeFormatted(): string {
    const remaining = Math.max(0, this.store.duration() - this.store.currentTime());
    return '-' + AudioService.formatTime(remaining);
  }

  togglePlay(): void {
    if (this.store.isPlaying()) {
      this.store.pause();
    } else {
      this.store.resume();
    }
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const time = (parseFloat(input.value) / 100) * this.store.duration();
    this.store.seek(time);
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setVolume(parseFloat(input.value));
  }

  readonly playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  setRate(rate: number): void {
    this.store.setPlaybackRate(rate);
  }
}
