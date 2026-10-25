
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * PrestaShop storefront Page Object.
 *
 * Handles:
 * - Opening the demo store
 * - Navigating to sign in
 * - Detecting authenticated customers
 * - Opening the customer dropdown
 * - Signing out
 * - Diagnosing server errors
 */
export class StorePage {
  readonly page: Page;
  readonly userInfo: Locator;
  readonly accountMenu: Locator;
  readonly signInLink: Locator;
  readonly signOutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Confirmed PrestaShop customer header
    this.userInfo = page.locator(
      '#_desktop_ps_customersignin'
    );

    // Confirmed account dropdown button
    this.accountMenu = this.userInfo.locator(
      '#userMenuButton'
    );

    // Confirmed sign-in link
    this.signInLink = this.userInfo.locator(
      'a[aria-label="Sign in"]'
    );

    // Confirmed sign-out link
    this.signOutLink = this.userInfo.locator(
      'a[href*="mylogout"]'
    );
  }

  /**
   * Check whether the demo server returned an error page.
   */
  private async checkServerError(): Promise<void> {
    const bodyText = await this.page
      .locator('body')
      .innerText({ timeout: 10000 })
      .catch(() => '');

    const serverError =
      /502 Bad Gateway|Bad gateway|503 Service Unavailable|504 Gateway Time-out/i.test(
        bodyText
      );

    if (serverError) {
      throw new Error(
        `PrestaShop demo server error detected.\n` +
        `URL: ${this.page.url()}\n` +
        `The server returned an error page instead of the store.`
      );
    }
  }

  /**
   * Print diagnostic information when an expected
   * element cannot be found.
   */
  private async logDiagnostics(): Promise<void> {
    console.log('\n========== STORE DIAGNOSTICS ==========');

    console.log('Current URL:', this.page.url());

    console.log(
      'Page title:',
      await this.page.title().catch(() => 'Unavailable')
    );

    console.log(
      'Customer header count:',
      await this.userInfo.count()
    );

    console.log(
      'Account menu count:',
      await this.accountMenu.count()
    );

    console.log(
      'Sign in link count:',
      await this.signInLink.count()
    );

    console.log(
      'Sign out link count:',
      await this.signOutLink.count()
    );

    console.log(
      'Page text:',
      (
        await this.page
          .locator('body')
          .innerText()
          .catch(() => '')
      ).slice(0, 800)
    );

    console.log('=======================================\n');
  }

  /**
   * Open the demo storefront directly.
   *
   * The PrestaShop demo initially loads the store
   * inside an iframe. We retrieve its URL and
   * navigate directly to it.
   *
   * STORE_URL can override automatic discovery.
   */
  async open(): Promise<void> {
    const storeUrl =
      process.env.STORE_URL ||
      (await this.getDemoStoreUrl());

    const response = await this.page.goto(storeUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });

    if (response && response.status() >= 500) {
      throw new Error(
        `PrestaShop server returned HTTP ${response.status()} ` +
        `while opening ${storeUrl}`
      );
    }

    await this.checkServerError();

    try {
      await expect(this.userInfo).toBeVisible({
        timeout: 60000,
      });
    } catch (error) {
      await this.logDiagnostics();
      await this.checkServerError();
      throw error;
    }
  }

  /**
   * Retrieve the current demo store URL.
   */
  private async getDemoStoreUrl(): Promise<string> {
    await this.page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });

    const demoFrame = this.page.locator(
      'iframe#framelive, iframe'
    ).first();

    let storeUrl = '';

    await expect
      .poll(
        async () => {
          storeUrl =
            (await demoFrame
              .getAttribute('src', {
                timeout: 1000,
              })
              .catch(() => null)) ?? '';

          return storeUrl;
        },
        {
          timeout: 90000,
          message:
            'The demo store iframe did not receive a valid URL.',
        }
      )
      .toMatch(/^https?:\/\//);

    return storeUrl;
  }

  /**
   * Navigate to the customer sign-in page.
   */
  async goToSignIn(): Promise<void> {
    await this.checkServerError();

    await expect(this.signInLink).toBeVisible({
      timeout: 15000,
    });

    await this.signInLink.click();

    await this.checkServerError();
  }

  /**
   * Check whether the customer account menu exists.
   *
   * This checks the logged-in account control,
   * not the hidden Sign out link.
   */
  async isLoggedIn(): Promise<boolean> {
    await this.checkServerError();

    return await this.accountMenu.isVisible();
  }

  /**
   * Open the customer account dropdown.
   */
  async openAccountMenu(): Promise<void> {
    await this.checkServerError();

    try {
      await expect(this.accountMenu).toBeVisible({
        timeout: 15000,
      });
    } catch (error) {
      await this.logDiagnostics();
      await this.checkServerError();
      throw error;
    }

    // Open dropdown only if Sign out is hidden
    if (!(await this.signOutLink.isVisible())) {
      await this.accountMenu.click();
    }

    await expect(this.signOutLink).toBeVisible({
      timeout: 15000,
    });
  }

  /**
   * Sign out the currently authenticated customer.
   */
  async signOut(): Promise<void> {
    await this.openAccountMenu();

    // Click Sign out without waiting for navigation
  await this.signOutLink.click({
    noWaitAfter: true,
    timeout: 15000,
  });
  // Wait for the signed-out state
  await expect(this.signInLink).toBeVisible({
    timeout: 30000,
  });
  // Verify the logged-in account menu is gone
  await expect(this.accountMenu).toHaveCount(0, {
    timeout: 30000,
  });
  }
}
