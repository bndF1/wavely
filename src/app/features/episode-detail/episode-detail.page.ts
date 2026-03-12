import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'wavely-episode-detail',
  templateUrl: './episode-detail.page.html',
  styleUrls: ['./episode-detail.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class EpisodeDetailPage {}
