import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  searchOutline,
  settingsOutline,
  chevronBack,
  chevronForward,
} from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { PlayerStore } from '../../store/player/player.store';
import { LayoutStore } from '../../store/layout/layout.store';
import { PlayerModalService } from '../../core/services/player-modal.service';
import { MiniPlayerComponent } from '../player/mini-player/mini-player.component';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner.component';

@Component({
  selector: 'wavely-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    MiniPlayerComponent,
    OfflineBannerComponent,
    TranslatePipe,
    RouterLink,
    RouterLinkActive,
  ],
})
export class TabsComponent {
  readonly store = inject(PlayerStore);
  readonly layoutStore = inject(LayoutStore);
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
      searchOutline,
      settingsOutline,
      chevronBack,
      chevronForward,
    });
    this.layoutStore.initFromStorage();
  }

  async openFullPlayer(): Promise<void> {
    if (!this.store.currentEpisode()?.id) return;
    await this.playerModal.open();
  }
}
