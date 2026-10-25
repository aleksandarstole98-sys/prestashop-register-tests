
import { test, expect } from '../fixtures/test';
import type { RegistrationPage } from '../pages/RegistrationPage';
import type { StorePage } from '../pages/StorePage';
import { createCustomer, invalidData } from '../utils/testData';

/**
 * Shared final check for every negative test:
 * the registration form is still visible and
 * the customer has not been logged in.
 */
async function expectNoAccountCreated(
  storePage: StorePage,
  registrationPage: RegistrationPage
): Promise<void> {
  // Registration form must remain visible
  await expect(registrationPage.form).toBeVisible();

  // The sign-in link must remain available
  await expect(storePage.signInLink).toBeVisible();

  // The logged-in customer menu must not exist
  await expect(storePage.accountMenu).toHaveCount(0);
}

test.describe('Registration - validation and error handling', () => {

  test.beforeEach(async ({ storePage, registrationPage }) => {
    await storePage.open();
    await storePage.goToSignIn();
    await registrationPage.openFromSignIn();
  });

  test('shows an error when the email is already registered', async ({
    storePage,
    registrationPage,
  }) => {
    // Arrange: create an account with a unique email
    const existingCustomer = createCustomer();

    await registrationPage.register(existingCustomer);

    // Open the account dropdown and verify successful login
    await storePage.openAccountMenu();

    // Log out before attempting to register again
    await storePage.signOut();

    // Act: register again using the same email
    await storePage.goToSignIn();
    await registrationPage.openFromSignIn();

    await registrationPage.register(
      createCustomer({
        email: existingCustomer.email,
      })
    );

    // Assert: duplicate email must be rejected
    await expect(
      registrationPage.fieldError('email')
    ).toContainText(/already used/i);

    await expectNoAccountCreated(storePage, registrationPage);
  });

  test('rejects an email address without an @ sign', async ({
    storePage,
    registrationPage,
  }) => {
    await registrationPage.register(
      createCustomer({
        email: invalidData.emailWithoutAt,
      })
    );

    await expect.poll(
      () => registrationPage.hasValidationProblem('email')
    ).toBe(true);

    await expectNoAccountCreated(storePage, registrationPage);
  });

  test('rejects a first name that contains digits', async ({
    storePage,
    registrationPage,
  }) => {
    await registrationPage.register(
      createCustomer({
        firstName: invalidData.nameWithDigits,
      })
    );

    await expect.poll(
      () => registrationPage.hasValidationProblem('firstname')
    ).toBe(true);

    await expectNoAccountCreated(storePage, registrationPage);
  });

  test('rejects a password that is too short', async ({
    storePage,
    registrationPage,
  }) => {
    await registrationPage.register(
      createCustomer({
        password: invalidData.shortPassword,
      })
    );

    await expect.poll(
      () => registrationPage.hasValidationProblem('password')
    ).toBe(true);

    await expectNoAccountCreated(storePage, registrationPage);
  });

  test('requires the customer data privacy consent', async ({
    storePage,
    registrationPage,
  }) => {
    // Fill valid data without accepting privacy consent
    await registrationPage.fillForm(createCustomer());

    await registrationPage.submit();

    await expect.poll(
      () => registrationPage.hasValidationProblem('customer_privacy')
    ).toBe(true);

    await expectNoAccountCreated(storePage, registrationPage);
  });

  test('does not submit an empty form', async ({
    storePage,
    registrationPage,
  }) => {
    await registrationPage.submit();

    await expect.poll(
      () => registrationPage.hasValidationProblem('firstname')
    ).toBe(true);

    await expectNoAccountCreated(storePage, registrationPage);
  });

});
