import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonButtons,
  IonButton,
  IonIcon,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline } from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { Podcast } from '../../core/models/podcast.model';

/** Dummy skeleton items used while data loads */
const SKELETON_COUNT = 6;

@Component({
  selector: 'wavely-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonText,
    IonButtons,
    IonButton,
    IonIcon,
    PodcastCardComponent
],
})
export class HomePage implements OnInit {
  private readonly api = inject(PodcastApiService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);

  /** Skeleton placeholder array */
  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });
  /** Dummy podcast used to satisfy required `podcast` input during skeleton render */
  protected readonly skeletonPodcast: Podcast = {
    id: '',
    title: '',
    author: '',
    description: '',
    artworkUrl: '',
    feedUrl: '',
    genres: [],
  };

  constructor() {
    addIcons({ searchOutline });
  }

  ngOnInit(): void {
    if (this.store.trending().length === 0) {
      this.loadTrending();
    }
  }

  protected async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.loadTrending();
    event.detail.complete();
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected navigateToSearch(): void {
    this.router.navigate(['/tabs/search']);
  }

  private loadTrending(): Promise<void> {
    this.store.setLoading(true);
    return new Promise((resolve) => {
      this.api.getTrendingPodcasts(25).subscribe({
        next: (podcasts) => {
          this.store.setTrending(podcasts);
          this.store.setLoading(false);
          resolve();
        },
        error: () => {
          this.store.setError('Could not load trending podcasts. Pull down to retry.');
          resolve();
        },
      });
    });
  }
}
