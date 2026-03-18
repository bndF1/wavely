import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  IonThumbnail,
  IonProgressBar,
  IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  logOutOutline,
  personCircleOutline,
  libraryOutline,
  timeOutline,
  checkmarkCircleOutline,
  radioButtonOffOutline,
  settingsOutline,
} from 'ionicons/icons';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { AuthStore } from '../../store/auth/auth.store';
import { HistoryStore, HistoryEntry, HistoryFilter } from '../../store/history/history.store';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';
import { HistorySyncService } from '../../core/services/history-sync.service';
import { Podcast } from '../../core/models/podcast.model';

import { environment } from '../../../environments/environment';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'wavely-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    IonThumbnail,
    IonProgressBar,
    IonChip,
    EmptyStateComponent,
    TranslatePipe,
  ],
})
export class LibraryPage {
  protected readonly store = inject(PodcastsStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly historyStore = inject(HistoryStore);
  protected readonly appVersion = environment.appVersion;
  private readonly syncService = inject(SubscriptionSyncService);
  private readonly historySyncService = inject(HistorySyncService);
  private readonly router = inject(Router);

  private static readonly HISTORY_LIMIT = 10;

  protected readonly showAllHistory = signal(false);

  protected readonly recentHistory = computed(() => {
    const entries = this.historyStore.filteredEntries();
    const filter = this.historyStore.activeFilter();
    if (filter === 'all' && !this.showAllHistory()) {
      return entries
        .filter((e) => !e.completed)
        .slice(0, LibraryPage.HISTORY_LIMIT);
    }
    return entries;
  });

  protected readonly hiddenCount = computed(() => {
    const filter = this.historyStore.activeFilter();
    if (filter !== 'all' || this.showAllHistory()) return 0;
    return this.historyStore.filteredEntries().length - this.recentHistory().length;
  });

  protected readonly historyFilters: { label: string; value: HistoryFilter }[] = [
    { label: 'library.filter_all', value: 'all' },
    { label: 'library.filter_unplayed', value: 'unplayed' },
    { label: 'library.filter_in_progress', value: 'inProgress' },
    { label: 'library.filter_completed', value: 'completed' },
  ];


  constructor() {
    addIcons({
      addOutline,
      logOutOutline,
      personCircleOutline,
      timeOutline,
      libraryOutline,
      checkmarkCircleOutline,
      radioButtonOffOutline,
      settingsOutline,
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

  protected selectFilter(filter: HistoryFilter): void {
    this.showAllHistory.set(false);
    this.historyStore.setFilter(filter);
  }

  protected async markPlayed(episodeId: string): Promise<void> {
    this.historyStore.markPlayed(episodeId);
    const uid = this.authStore.user()?.uid ?? '';
    if (!uid) return;

    await this.historySyncService.updateEntry(episodeId, { completed: true }, uid);
  }

  protected async markUnplayed(episodeId: string): Promise<void> {
    this.historyStore.markUnplayed(episodeId);
    const uid = this.authStore.user()?.uid ?? '';
    if (!uid) return;

    await this.historySyncService.updateEntry(episodeId, { completed: false, position: 0 }, uid);
  }

  protected navigateToPodcast(podcast: Podcast): void {
    this.router.navigate(['/podcast', podcast.id]);
  }

  protected navigateToBrowse(): void {
    this.router.navigate(['/tabs/discover']);
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

  protected toggleShowAll(): void {
    this.showAllHistory.update((v) => !v);
  }

  protected formatRelativeTime(ts: number): string {
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  protected navigateToSettings(): void {
    this.router.navigate(['/settings']);
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
