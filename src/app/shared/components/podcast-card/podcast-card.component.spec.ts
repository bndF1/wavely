import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodcastCardComponent } from './podcast-card.component';
import { mockPodcast } from '../../../../testing/podcast-fixtures';

describe('PodcastCardComponent', () => {
  let fixture: ComponentFixture<PodcastCardComponent>;
  let component: PodcastCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodcastCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PodcastCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('podcast', mockPodcast({ id: 'pod-1' }));
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('falls back to default artwork on image error', () => {
    const image = document.createElement('img');

    component.onImageError({ target: image } as unknown as Event);

    expect(image.src).toContain('/default-artwork.svg');
  });

  it('emits cardClick on space key when not loading', () => {
    const emitSpy = jest.spyOn(component.cardClick, 'emit');

    component.onSpaceKey({ preventDefault: jest.fn() } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith(component.podcast());
  });
});
