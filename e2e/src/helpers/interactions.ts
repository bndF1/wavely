import { type Locator } from '@playwright/test';

/**
 * Clicks a locator in a viewport-safe way across responsive layouts.
 * This keeps Playwright actionability checks intact (no force click).
 */
export async function clickInViewport(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  await locator.click({ trial: true });
  await locator.click();
}
