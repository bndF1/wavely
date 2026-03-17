import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

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
  private readonly router = inject(Router);

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

  openFullPlayer(): void {
    const episode = this.store.currentEpisode();
    if (episode?.id) {
      void this.router.navigate(['/episode', episode.id]);
    }
  }
}
