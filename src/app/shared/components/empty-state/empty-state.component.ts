import { Component, input, output } from '@angular/core';

import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'wavely-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  imports: [IonIcon, IonText, IonButton],
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly actionLabel = input<string | null>(null);

  readonly action = output<void>();

  protected emitAction(): void {
    this.action.emit();
  }
}
