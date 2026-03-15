import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRange,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  ModalController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronDown,
  playCircle,
  pauseCircle,
  playSkipBack,
  playSkipForward,
  speedometer,
  ellipsisHorizontal,
  closeCircleOutline,
  listOutline,
} from 'ionicons/icons';
import { PlayerStore } from '../../../store/player/player.store';
import { AudioService } from '../../../core/services/audio.service';
import { RangeCustomEvent } from '@ionic/angular';

@Component({
  selector: 'wavely-full-player',
  templateUrl: './full-player.component.html',
  styleUrls: ['./full-player.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRange,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
  ],
})
export class FullPlayerComponent {
  readonly store = inject(PlayerStore);
  private readonly modalCtrl = inject(ModalController);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  readonly rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  get isLive(): boolean {
    return this.store.currentEpisode()?.isLive === true;
  }

  constructor() {
    addIcons({ chevronDown, playCircle, pauseCircle, playSkipBack, playSkipForward, speedometer, ellipsisHorizontal, closeCircleOutline, listOutline });
  }

  get progressValue(): number {
    const dur = this.store.duration();
    return dur > 0 ? this.store.currentTime() / dur : 0;
  }

  get currentTimeLabel(): string {
    return AudioService.formatTime(this.store.currentTime());
  }

  get remainingTimeLabel(): string {
    const rem = this.store.duration() - this.store.currentTime();
    return '-' + AudioService.formatTime(Math.max(0, rem));
  }

  get rateLabel(): string {
    const r = this.store.playbackRate();
    return r === 1 ? '1×' : `${r}×`;
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  togglePlay(): void {
    if (this.store.isPlaying()) {
      this.store.pause();
    } else {
      this.store.resume();
    }
  }

  onScrubChange(event: Event): void {
    const value = (event as RangeCustomEvent).detail.value as number;
    const seekTo = (value / 100) * this.store.duration();
    this.store.seek(seekTo);
  }

  skipBack(): void {
    this.store.skipBack(15);
  }

  skipForward(): void {
    this.store.skipForward(30);
  }

  async showSpeedPicker(): Promise<void> {
    const current = this.store.playbackRate();
    const buttons = this.rates.map((r) => ({
      text: `${r}×${r === current ? '  ✓' : ''}`,
      handler: () => this.store.setPlaybackRate(r),
    }));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    buttons.push({ text: 'Cancel', handler: () => {} });

    const sheet = await this.actionSheetCtrl.create({
      header: 'Playback speed',
      buttons,
    });
    await sheet.present();
  }
}
