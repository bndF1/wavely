import { Component, inject } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  compassOutline,
  compass,
  radioOutline,
  radio,
  libraryOutline,
  library,
} from 'ionicons/icons';
import { PlayerStore } from '../../store/player/player.store';
import { MiniPlayerComponent } from '../player/mini-player/mini-player.component';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner.component';
import { FullPlayerComponent } from '../player/full-player/full-player.component';

@Component({
  selector: 'wavely-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    MiniPlayerComponent,
    OfflineBannerComponent,
  ],
})
export class TabsComponent {
  readonly store = inject(PlayerStore);
  private readonly modalCtrl = inject(ModalController);

  constructor() {
    addIcons({
      homeOutline,
      home,
      compassOutline,
      compass,
      radioOutline,
      radio,
      libraryOutline,
      library,
    });
  }

  async openFullPlayer(): Promise<void> {
    if (!this.store.currentEpisode()?.id) return;

    const existing = await this.modalCtrl.getTop();
    if (existing?.classList.contains('full-player-modal')) return;

    const modal = await this.modalCtrl.create({
      component: FullPlayerComponent,
      cssClass: 'full-player-modal',
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: false,
      canDismiss: true,
    });
    await modal.present();
  }
}
