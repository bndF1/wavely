import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [IonIcon, IonButton],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly title = input('Something went wrong');
  readonly message = input('Failed to load content');
  readonly icon = input('cloud-offline-outline');
  readonly retryLabel = input('Try Again');

  readonly retry = output<void>();

  constructor() {
    addIcons({ cloudOfflineOutline });
  }
}
