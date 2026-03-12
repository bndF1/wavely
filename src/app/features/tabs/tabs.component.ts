import { Component, inject } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonFooter,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  compassOutline,
  compass,
  searchOutline,
  search,
  libraryOutline,
  library,
} from 'ionicons/icons';
import { PlayerStore } from '../../store/player/player.store';
import { MiniPlayerComponent } from '../player/mini-player/mini-player.component';
import { FullPlayerComponent } from '../player/full-player/full-player.component';

@Component({
  selector: 'wavely-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonFooter, MiniPlayerComponent],
})
export class TabsComponent {
  readonly store = inject(PlayerStore);
  private readonly modalCtrl = inject(ModalController);

  constructor() {
    addIcons({
      homeOutline, home,
      compassOutline, compass,
      searchOutline, search,
      libraryOutline, library,
    });
  }

  async openFullPlayer(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: FullPlayerComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: true,
      cssClass: 'full-player-modal',
    });
    await modal.present();
  }
}
