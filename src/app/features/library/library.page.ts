import { Component, computed, inject } from '@angular/core';
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
  IonButtons,
  IonButton,
  IonIcon,
  IonPopover,
  IonListHeader,
  IonRadioGroup,
  IonRadio,
  IonThumbnail,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  moonOutline,
  sunnyOutline,
  contrastOutline,
  logOutOutline,
  personCircleOutline,
  libraryOutline,
  timeOutline,
} from 'ionicons/icons';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { AuthStore } from '../../store/auth/auth.store';
import { HistoryStore, HistoryEntry } from '../../store/history/history.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { HistorySyncService } from '../../core/services/history-sync.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { Podcast } from '../../core/models/podcast.model';

import { environment } from '../../../environments/environment';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

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
    IonButtons,
    IonButton,
    IonIcon,
    IonPopover,
    IonListHeader,
    IonRadioGroup,
    IonRadio,
    IonThumbnail,
    IonProgressBar,
    EmptyStateComponent,
  ],
})
export class LibraryPage {
  protected readonly store = inject(PodcastsStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly historyStore = inject(HistoryStore);
  protected readonly themeService = inject(ThemeService);
  protected readonly appVersion = environment.appVersion;
  private readonly syncService = inject(SubscriptionSyncService);
  private readonly historySyncService = inject(HistorySyncService);
  private readonly router = inject(Router);

  protected readonly recentHistory = computed(() => this.historyStore.entries().slice(0, 10));

  protected readonly themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
    { label: 'System default', value: 'system', icon: 'contrast-outline' },
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  ];

  constructor() {
    addIcons({
      addOutline,
      moonOutline,
      sunnyOutline,
      contrastOutline,
      logOutOutline,
      personCircleOutline,
      timeOutline,
      libraryOutline,
    });
    this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    const uid = this.authStore.user()?.uid ?? null;
    if (!uid) {
      this.historyStore.clear();
      return;
    }

    this.historyStore.setLoading(true);
    try {
      const entries = await this.historySyncService.loadHistory(uid);
      this.historyStore.setEntries(entries);
    } catch (err) {
      console.error('[LibraryPage] Failed to load history', err);
      this.historyStore.setLoading(false);
    }
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected navigateToBrowse(): void {
    this.router.navigate(['/tabs/browse']);
  }

  protected unsubscribe(podcast: Podcast, slidingItem: IonItemSliding): void {
    slidingItem.close();
    const uid = this.authStore.user()?.uid ?? null;
    this.syncService.removeSubscription(podcast.id, uid);
  }

  protected async clearHistory(): Promise<void> {
    const uid = this.authStore.user()?.uid ?? null;
    await this.historySyncService.clearHistory(uid ?? '');
  }

  protected progressValue(entry: HistoryEntry): number {
    if (entry.duration <= 0) return 0;
    return Math.min(1, Math.max(0, entry.position / entry.duration));
  }

  protected formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  protected async signOut(): Promise<void> {
    await this.authStore.signOut();
    this.router.navigate(['/login']);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/default-artwork.svg';
  }
}
