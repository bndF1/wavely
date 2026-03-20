import { type Locator } from '@playwright/test';

/**
 * Clicks a locator across both mobile and desktop layouts.
 *
 * Tries force: true (which bypasses visibility/overlap checks and dispatches
 * the full pointer+mouse+click event sequence so Angular/Ionic handlers fire
 * reliably). Falls back to el.click() in the browser JS context for elements
 * that are physically outside the viewport bounds (e.g. the mini-player at
 * the bottom of a 1280×720 headless window) — force: true still throws
 * "Element is outside of the viewport" in that case.
 */
export async function clickInViewport(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.click({ force: true });
  } catch (e) {
    if ((e as Error).message?.includes('outside of the viewport')) {
      await locator.evaluate((el: HTMLElement) => el.click());
    } else {
      throw e;
    }
  }
}
