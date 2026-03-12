import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'wavely-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class BrowsePage {}
