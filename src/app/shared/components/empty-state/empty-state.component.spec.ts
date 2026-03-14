import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('renders icon, title, subtitle and optional action button', () => {
    fixture.componentRef.setInput('icon', 'search-outline');
    fixture.componentRef.setInput('title', 'No results');
    fixture.componentRef.setInput('subtitle', 'Try another query');
    fixture.componentRef.setInput('actionLabel', 'Retry');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No results');
    expect(fixture.nativeElement.textContent).toContain('Try another query');
    expect(fixture.nativeElement.querySelector('ion-icon')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });

  it('emits action when action button is clicked', () => {
    fixture.componentRef.setInput('icon', 'search-outline');
    fixture.componentRef.setInput('title', 'No results');
    fixture.componentRef.setInput('subtitle', 'Try another query');
    fixture.componentRef.setInput('actionLabel', 'Retry');

    const actionSpy = jest.fn();
    component.action.subscribe(actionSpy);

    fixture.detectChanges();
    fixture.nativeElement.querySelector('ion-button').click();

    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});
