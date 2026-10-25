
import { expect, type Locator, type Page } from '@playwright/test';
import type { Customer } from '../utils/testData';

/**
 * PrestaShop customer registration page.
 *
 * Handles:
 * - Opening the registration form
 * - Filling customer information
 * - Selecting optional fields
 * - Accepting privacy consents
 * - Submitting registration
 * - Detecting browser and server validation errors
 */
export class RegistrationPage {
  readonly page: Page;
  readonly createAccountLink: Locator;
  readonly form: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly birthdayInput: Locator;
  readonly partnerOffersCheckbox: Locator;
  readonly newsletterCheckbox: Locator;
  readonly customerPrivacyCheckbox: Locator;
  readonly termsCheckbox: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Confirmed registration link
    this.createAccountLink = page.locator(
      'a[data-link-action="display-register-form"]'
    );

    // Registration form
    this.form = page.locator('#customer-form');

    // Required customer fields
    this.firstNameInput = this.form.locator(
      'input[name="firstname"]'
    );

    this.lastNameInput = this.form.locator(
      'input[name="lastname"]'
    );

    this.emailInput = this.form.locator(
      'input[name="email"]'
    );

    this.passwordInput = this.form.locator(
      'input[name="password"]'
    );

    // Optional customer fields
    this.birthdayInput = this.form.locator(
      'input[name="birthday"]'
    );

    this.partnerOffersCheckbox = this.form.locator(
      'input[name="optin"]'
    );

    this.newsletterCheckbox = this.form.locator(
      'input[name="newsletter"]'
    );

    // Privacy and GDPR consent
    this.customerPrivacyCheckbox = this.form.locator(
      'input[name="customer_privacy"]'
    );

    this.termsCheckbox = this.form.locator(
      'input[name="psgdpr"]'
    );

    // Registration submit button
    this.saveButton = this.form.locator(
      '.form-control-submit'
    );
  }

  /**
   * Select customer social title.
   */
  socialTitleRadio(title: 'Mr' | 'Mrs'): Locator {
    const value = title === 'Mr' ? '1' : '2';

    return this.form.locator(
      `input[name="id_gender"][value="${value}"]`
    );
  }

  /**
   * Open registration form from sign-in page.
   */
  async openFromSignIn(): Promise<void> {
    await expect(this.createAccountLink).toBeVisible({
      timeout: 15000,
    });

    await this.createAccountLink.click();

    await expect(this.form).toBeVisible({
      timeout: 15000,
    });
  }

  /**
   * Fill required and optional customer fields.
   */
  async fillForm(customer: Customer): Promise<void> {
    await expect(this.form).toBeVisible({
      timeout: 15000,
    });

    if (customer.socialTitle) {
      await this.socialTitleRadio(
        customer.socialTitle
      ).check();
    }

    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.emailInput.fill(customer.email);
    await this.passwordInput.fill(customer.password);

    if (customer.birthday) {
      await this.birthdayInput.fill(customer.birthday);
    }

    if (customer.partnerOffers) {
      await this.partnerOffersCheckbox.check();
    }

    if (customer.newsletter) {
      await this.newsletterCheckbox.check();
    }
  }

  /**
   * Accept mandatory privacy consents.
   */
  async acceptRequiredConsents(): Promise<void> {
    await expect(
      this.customerPrivacyCheckbox
    ).toBeVisible({
      timeout: 15000,
    });

    await this.customerPrivacyCheckbox.check();

    // GDPR checkbox may not exist on every demo store
    if ((await this.termsCheckbox.count()) > 0) {
      await this.termsCheckbox.check();
    }
  }

  /**
   * Submit registration form.
   */
  async submit(): Promise<void> {
    await expect(this.saveButton).toBeVisible({
      timeout: 15000,
    });

    await expect(this.saveButton).toBeEnabled({
      timeout: 15000,
    });

    await this.saveButton.click();
  }

  /**
   * Complete registration flow.
   */
  async register(customer: Customer): Promise<void> {
    await this.fillForm(customer);
    await this.acceptRequiredConsents();
    await this.submit();
  }

  /**
   * Locate the field container.
   *
   * Confirmed HTML:
   * <div class="mb-3 has-error">
   *   <input name="firstname" ...>
   *   ...
   * </div>
   */
  fieldContainer(fieldName: string): Locator {
    return this.form
      .locator('.mb-3, .form-group')
      .filter({
        has: this.form.locator(
          `[name="${fieldName}"]`
        ),
      })
      .first();
  }

  /**
   * Find server-side validation messages.
   *
   * Supports PrestaShop error messages such as:
   * "Invalid format."
   */
  fieldError(fieldName: string): Locator {
    return this.fieldContainer(fieldName).locator(
      '.alert-danger, ' +
      '.invalid-feedback, ' +
      '.help-block.text-danger, ' +
      '.form-control-comment.text-danger'
    );
  }

  /**
   * Detect browser-side or server-side validation errors.
   *
   * Checks:
   * 1. HTML5 validity
   * 2. Visible server validation messages
   * 3. PrestaShop has-error class
   * 4. Invalid input CSS classes
   * 5. aria-invalid attribute
   */
  async hasValidationProblem(
    fieldName: string
  ): Promise<boolean> {
    try {
      const input = this.form
        .locator(`[name="${fieldName}"]`)
        .first();

      if ((await input.count()) === 0) {
        return false;
      }

      // 1. Browser HTML5 validation
      const invalidInBrowser = await input.evaluate(
        (element) => {
          if (
            element instanceof HTMLInputElement
          ) {
            return !element.validity.valid;
          }

          return false;
        }
      );

      if (invalidInBrowser) {
        return true;
      }

      // 2. Visible server-side validation message
      const errorShownByServer = await this
        .fieldError(fieldName)
        .first()
        .isVisible();

      if (errorShownByServer) {
        return true;
      }

      // 3. PrestaShop marks invalid fields with has-error
      const fieldHasError = await this
        .fieldContainer(fieldName)
        .evaluate((element) =>
          element.classList.contains('has-error')
        );

      if (fieldHasError) {
        return true;
      }

      // 4. Input validation classes and ARIA attributes
      const invalidClass = await input.evaluate(
        (element) =>
          element.classList.contains('is-invalid') ||
          element.classList.contains('error') ||
          element.getAttribute('aria-invalid') === 'true'
      );

      return invalidClass;
    } catch {
      // Page may be navigating after submission
      return false;
    }
  }
}
