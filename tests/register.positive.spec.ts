
import { test, expect } from '../fixtures/test';
import { createCustomer } from '../utils/testData';

test.describe('Registration - successful account creation', () => {

  test.beforeEach(async ({ storePage, registrationPage }) => {
    await storePage.open();
    await storePage.goToSignIn();
    await registrationPage.openFromSignIn();
  });

  test('registers a new customer with only the required fields', async ({
    storePage,
    registrationPage,
  }) => {
    const customer = createCustomer();

    // Register a new customer
    await registrationPage.register(customer);

    // Registration form should disappear after success
    await expect(registrationPage.form).toBeHidden({
      timeout: 15000,
    });

    // Verify the customer account menu is available
    await expect(storePage.accountMenu).toBeVisible({
      timeout: 15000,
    });

    // Verify the registered customer's name
    await expect(storePage.userInfo).toContainText(
      `${customer.firstName} ${customer.lastName}`
    );

    // Open dropdown and verify Sign out is available
    await storePage.openAccountMenu();
  });

  test('registers a new customer with all optional fields filled', async ({
    storePage,
    registrationPage,
  }) => {
    const customer = createCustomer({
      socialTitle: 'Mrs',
      firstName: 'Jane',
      birthday: '05/31/1990',
      partnerOffers: true,
      newsletter: true,
    });

    // Register a customer with optional information
    await registrationPage.register(customer);

    // Registration form should disappear after success
    await expect(registrationPage.form).toBeHidden({
      timeout: 15000,
    });

    // Verify the customer account menu is available
    await expect(storePage.accountMenu).toBeVisible({
      timeout: 15000,
    });

    // Verify the registered customer's name
    await expect(storePage.userInfo).toContainText(
      `${customer.firstName} ${customer.lastName}`
    );

    // Open dropdown and verify Sign out is available
    await storePage.openAccountMenu();
  });

});
