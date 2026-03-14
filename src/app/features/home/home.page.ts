import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  libraryOutline,
  refreshOutline,
  searchOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { PodcastApiService } from '../../core/services/podcast-api.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { PodcastCardComponent } from '../../shared/components/podcast-card/podcast-card.component';
import { Podcast } from '../../core/models/podcast.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

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
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSkeletonText,
    PodcastCardComponent,
    EmptyStateComponent,
  ],
})
export class HomePage implements OnInit {
  private readonly api = inject(PodcastApiService);
  protected readonly store = inject(PodcastsStore);
  private readonly router = inject(Router);

  private readonly country: string;

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });

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
    this.country = this.api.detectCountry();
    addIcons({
      searchOutline,
      refreshOutline,
      libraryOutline,
      alertCircleOutline,
      sparklesOutline,
    });
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

  protected retryTrending(): void {
    void this.loadTrending();
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected navigateToSearch(): void {
    this.router.navigate(['/tabs/search']);
  }

  protected navigateToBrowse(): void {
    this.router.navigate(['/tabs/browse']);
  }

  private loadTrending(): Promise<void> {
    this.store.setLoading(true);
    return new Promise((resolve) => {
      this.api.getTrendingPodcasts(25, undefined, this.country).subscribe({
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
