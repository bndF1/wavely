import { type Locator } from '@playwright/test';

/**
 * Clicks a locator across both mobile and desktop layouts.
 *
 * Uses dispatchEvent('click') so that fixed/overflow elements (e.g. the
 * mini-player, ion-item-sliding action buttons) are not rejected by
 * Playwright's "element is outside of the viewport" actionability check.
 * The element must still be attached to the DOM; non-existent locators
 * will still throw.
 */
export async function clickInViewport(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.dispatchEvent('click');
}
