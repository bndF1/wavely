import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonListHeader, IonRadioGroup, IonRadio, IonToggle,
  IonIcon, IonButtons, IonBackButton, IonNote, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sunnyOutline, moonOutline, contrastOutline, listOutline, languageOutline,
} from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'wavely-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonListHeader, IonRadioGroup, IonRadio, IonToggle,
    IonIcon, IonButtons, IonBackButton, IonNote, IonSelect, IonSelectOption,
    TranslatePipe,
  ],
})
export class SettingsPage {
  protected readonly themeService = inject(ThemeService);
  protected readonly prefs = inject(UserPreferencesService);
  protected readonly languageService = inject(LanguageService);
  protected readonly appVersion = environment.appVersion;

  protected readonly themeOptions: { labelKey: string; value: ThemeMode; icon: string }[] = [
    { labelKey: 'settings.theme_system', value: 'system', icon: 'contrast-outline' },
    { labelKey: 'settings.theme_light', value: 'light', icon: 'sunny-outline' },
    { labelKey: 'settings.theme_dark', value: 'dark', icon: 'moon-outline' },
  ];

  constructor() {
    addIcons({ sunnyOutline, moonOutline, contrastOutline, listOutline, languageOutline });
  }

  onAutoQueueChange(event: CustomEvent<{ checked: boolean }>): void {
    this.prefs.setAutoQueueEnabled(event.detail.checked);
  }

  onLanguageChange(event: CustomEvent<{ value: string }>): void {
    this.languageService.setLanguage(event.detail.value);
  }
}
