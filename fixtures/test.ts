import { test as base, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';
import { StorePage } from '../pages/StorePage';

/**
 * Custom test fixtures.
 * Instead of writing "new StorePage(page)" in every test, tests ask for
 * "storePage" and "registrationPage" and Playwright creates them.
 */
type Pages = {
  storePage: StorePage;
  registrationPage: RegistrationPage;
};

export const test = base.extend<Pages>({
  storePage: async ({ page }, use) => {
    await use(new StorePage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
});

export { expect };
