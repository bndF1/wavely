import { Component } from '@angular/core';
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
  searchOutline,
  search,
  libraryOutline,
  library,
} from 'ionicons/icons';

@Component({
  selector: 'wavely-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsComponent {
  constructor() {
    addIcons({
      homeOutline, home,
      compassOutline, compass,
      searchOutline, search,
      libraryOutline, library,
    });
  }
}
