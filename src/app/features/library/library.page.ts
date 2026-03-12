import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonAvatar,
  IonLabel,
  IonNote,
  IonText,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { Podcast } from '../../core/models/podcast.model';

@Component({
  selector: 'wavely-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  imports: [
    NgFor,
    NgIf,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonAvatar,
    IonLabel,
    IonNote,
    IonText,
    IonButtons,
    IonButton,
    IonIcon,
  ],
})
export class LibraryPage {
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ addOutline });
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected navigateToBrowse(): void {
    this.router.navigate(['/tabs/browse']);
  }

  protected unsubscribe(podcast: Podcast, slidingItem: IonItemSliding): void {
    slidingItem.close();
    this.store.removeSubscription(podcast.id);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/default-artwork.svg';
  }
}
