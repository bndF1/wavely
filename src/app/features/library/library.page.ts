import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

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
  IonPopover,
  IonListHeader,
  IonRadioGroup,
  IonRadio,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, moonOutline, sunnyOutline, contrastOutline } from 'ionicons/icons';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { Podcast } from '../../core/models/podcast.model';

@Component({
  selector: 'wavely-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  imports: [
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
    IonPopover,
    IonListHeader,
    IonRadioGroup,
    IonRadio
],
})
export class LibraryPage {
  protected readonly store = inject(PodcastsStore);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
    { label: 'System default', value: 'system', icon: 'contrast-outline' },
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  ];

  constructor() {
    addIcons({ addOutline, moonOutline, sunnyOutline, contrastOutline });
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
