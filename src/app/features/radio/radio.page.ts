import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  ActionSheetController,
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, radioOutline, refreshOutline } from 'ionicons/icons';
import { Subject, catchError, of, switchMap, takeUntil, tap } from 'rxjs';

import { RadioStation } from '../../core/models/radio-station.model';
import { PODCAST_MARKETS, CountryService } from '../../core/services/country.service';
import { RadioApiService, radioStationToEpisode } from '../../core/services/radio-api.service';
import { PlayerStore } from '../../store/player/player.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

const SKELETON_COUNT = 8;
const MAX_TAG_CHIPS = 14;
const ALL_TAG = 'All';

@Component({
  selector: 'wavely-radio',
  standalone: true,
  templateUrl: './radio.page.html',
  styleUrls: ['./radio.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonChip,
    IonLabel,
    IonList,
    IonItem,
    IonThumbnail,
    IonBadge,
    IonSkeletonText,
    SlicePipe,
    EmptyStateComponent,
  ],
})
export class RadioPage implements OnDestroy {
  private readonly radioApi = inject(RadioApiService);
  private readonly playerStore = inject(PlayerStore);
  protected readonly countryService = inject(CountryService);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT });

  protected readonly stations = signal<RadioStation[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedTag = signal(ALL_TAG);

  protected readonly availableTags = computed(() => {
    const tags = new Map<string, number>();

    for (const station of this.stations()) {
      const rawTags = station.tags
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (!rawTags?.length) continue;

      for (const tag of rawTags) {
        const normalized = tag.toLowerCase();
        tags.set(normalized, (tags.get(normalized) ?? 0) + 1);
      }
    }

    return [
      ALL_TAG,
      ...[...tags.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_TAG_CHIPS)
        .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1)),
    ];
  });

  protected readonly filteredStations = computed(() => {
    const selected = this.selectedTag();
    if (selected === ALL_TAG) return this.stations();

    const needle = selected.toLowerCase();
    return this.stations().filter((station) =>
      (station.tags ?? '')
        .toLowerCase()
        .split(',')
        .map((tag) => tag.trim())
        .includes(needle)
    );
  });

  private readonly country$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({ alertCircleOutline, refreshOutline, radioOutline });

    this.country$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
          this.stations.set([]);
          this.selectedTag.set(ALL_TAG);
        }),
        switchMap((country) =>
          this.radioApi.getStationsByCountry(country).pipe(
            catchError(() => {
              this.error.set('Could not load radio stations. Please try again.');
              return of([] as RadioStation[]);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((stations) => {
        this.stations.set(stations);
        this.isLoading.set(false);
      });

    this.country$.next(this.countryService.country());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected selectTag(tag: string): void {
    this.selectedTag.set(tag);
  }

  protected playStation(station: RadioStation): void {
    this.radioApi.registerClick(station.stationuuid).subscribe();
    this.playerStore.play(radioStationToEpisode(station));
  }

  protected retry(): void {
    this.country$.next(this.countryService.country());
  }

  protected async presentCountryPicker(): Promise<void> {
    const currentCode = this.countryService.country();
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Radio by Country',
      buttons: [
        ...PODCAST_MARKETS.map((market) => ({
          text: `${this.countryService.getFlag(market.code)} ${market.name}`,
          cssClass: market.code === currentCode ? 'country-active' : '',
          handler: () => {
            this.countryService.setCountry(market.code);
            this.country$.next(market.code);
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });

    await actionSheet.present();
  }

  protected get currentMarketName(): string {
    const code = this.countryService.country();
    return PODCAST_MARKETS.find((m) => m.code === code)?.name ?? code.toUpperCase();
  }
}
