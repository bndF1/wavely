import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly STORAGE_KEY = 'wavely_search_history';
  private readonly MAX_ITEMS = 8;

  getHistory(): string[] {
    const rawHistory = localStorage.getItem(this.STORAGE_KEY);
    if (!rawHistory) {
      return [];
    }

    try {
      const parsedHistory = JSON.parse(rawHistory);
      if (!Array.isArray(parsedHistory)) {
        return [];
      }

      return parsedHistory.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    } catch {
      return [];
    }
  }

  addQuery(term: string): void {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) {
      return;
    }

    const history = this.getHistory();
    const dedupedHistory = history.filter((item) => item.toLowerCase() !== normalizedTerm.toLowerCase());
    const nextHistory = [normalizedTerm, ...dedupedHistory].slice(0, this.MAX_ITEMS);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nextHistory));
  }

  removeQuery(term: string): void {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) {
      return;
    }

    const nextHistory = this.getHistory().filter((item) => item.toLowerCase() !== normalizedTerm.toLowerCase());
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nextHistory));
  }

  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
