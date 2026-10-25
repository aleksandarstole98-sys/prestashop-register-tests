/**
 * Test data for the registration tests.
 *
 * Every customer gets a unique email address, so tests never collide with
 * each other or with accounts created in earlier runs.
 */

export interface Customer {
  socialTitle?: 'Mr' | 'Mrs';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** Format expected by the English store: MM/DD/YYYY */
  birthday?: string;
  partnerOffers?: boolean;
  newsletter?: boolean;
}

function uniqueId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function uniqueEmail(): string {
  return `qa.register.${uniqueId()}@example.com`;
}

/**
 * Returns a valid customer with only the required fields filled.
 * Pass "overrides" to change any field, for example:
 *   createCustomer({ email: 'not-an-email' })
 */
export function createCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    firstName: 'John',
    lastName: 'Tester',
    email: uniqueEmail(),
    password: `Qa-Strong-Pass-${uniqueId()}!`,
    ...overrides,
  };
}

/** Values that the registration form should reject. */
export const invalidData = {
  emailWithoutAt: 'john.tester.example.com',
  nameWithDigits: 'John123',
  shortPassword: 'abc',
};
