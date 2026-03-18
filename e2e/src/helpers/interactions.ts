import { type Locator } from '@playwright/test';

/**
 * Clicks a locator across both mobile and desktop layouts.
 *
 * Uses force: true so that fixed/overflow elements (e.g. the mini-player,
 * ion-item-sliding action buttons) are not rejected by Playwright's
 * "element is outside of the viewport" actionability check.
 * Unlike dispatchEvent, force click dispatches the full pointer+mouse+click
 * event sequence so Angular/Ionic handlers fire reliably.
 */
export async function clickInViewport(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}
