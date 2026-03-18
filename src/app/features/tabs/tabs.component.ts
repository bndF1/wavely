import { Component, inject } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
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
import { TranslatePipe } from '@ngx-translate/core';
import { PlayerStore } from '../../store/player/player.store';
import { PlayerModalService } from '../../core/services/player-modal.service';
import { MiniPlayerComponent } from '../player/mini-player/mini-player.component';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner.component';

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
    TranslatePipe,
  ],
})
export class TabsComponent {
  readonly store = inject(PlayerStore);
  private readonly playerModal = inject(PlayerModalService);

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
    await this.playerModal.open();
  }
}
