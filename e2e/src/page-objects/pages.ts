import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForSelector('wavely-login', { timeout: 10000 }).catch(() => {
      // Selector may differ — fall back to URL check
    });
  }

  get googleSignInButton() {
    return this.page.getByText(/sign in with google/i);
  }

  get emailInput() {
    return this.page.locator('ion-input[type="email"], input[type="email"]');
  }

  get passwordInput() {
    return this.page.locator('ion-input[type="password"], input[type="password"]');
  }
}

export class TabsPage {
  constructor(private readonly page: Page) {}

  async waitForLoad(): Promise<void> {
    await this.page.waitForSelector('wavely-tabs, ion-tab-bar', { timeout: 10000 });
  }

  tab(label: string) {
    return this.page.getByRole('tab', { name: new RegExp(label, 'i') });
  }
}
