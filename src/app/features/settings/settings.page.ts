import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonListHeader, IonRadioGroup, IonRadio, IonToggle,
  IonIcon, IonButtons, IonBackButton, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sunnyOutline, moonOutline, contrastOutline, listOutline,
} from 'ionicons/icons';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'wavely-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonListHeader, IonRadioGroup, IonRadio, IonToggle,
    IonIcon, IonButtons, IonBackButton, IonNote,
  ],
})
export class SettingsPage {
  protected readonly themeService = inject(ThemeService);
  protected readonly prefs = inject(UserPreferencesService);
  protected readonly appVersion = environment.appVersion;

  protected readonly themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
    { label: 'System default', value: 'system', icon: 'contrast-outline' },
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  ];

  constructor() {
    addIcons({ sunnyOutline, moonOutline, contrastOutline, listOutline });
  }

  onAutoQueueChange(event: CustomEvent<{ checked: boolean }>): void {
    this.prefs.setAutoQueueEnabled(event.detail.checked);
  }
}
