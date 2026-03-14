import { TestBed } from '@angular/core/testing';
import { SearchHistoryService } from './search-history.service';

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;
  const STORAGE_KEY = 'wavely_search_history';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [SearchHistoryService] });
    service = TestBed.inject(SearchHistoryService);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('returns empty array when nothing is stored', () => {
    expect(service.getHistory()).toEqual([]);
  });

  it('addQuery adds and deduplicates entries', () => {
    service.addQuery('Angular');
    service.addQuery('Ionic');
    service.addQuery('angular');

    expect(service.getHistory()).toEqual(['angular', 'Ionic']);
  });

  it('addQuery limits history to 8 items', () => {
    for (let i = 1; i <= 10; i += 1) {
      service.addQuery(`Query ${i}`);
    }

    expect(service.getHistory()).toEqual([
      'Query 10',
      'Query 9',
      'Query 8',
      'Query 7',
      'Query 6',
      'Query 5',
      'Query 4',
      'Query 3',
    ]);
  });

  it('removeQuery removes a single entry', () => {
    service.addQuery('Angular');
    service.addQuery('Ionic');

    service.removeQuery('Angular');

    expect(service.getHistory()).toEqual(['Ionic']);
  });

  it('clearAll empties storage', () => {
    service.addQuery('Angular');

    service.clearAll();

    expect(service.getHistory()).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
