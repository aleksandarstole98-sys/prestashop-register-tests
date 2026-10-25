# PrestaShop Register - Playwright Tests

End-to-end tests for the **Register** (Create an account) functionality of the
[PrestaShop demo store](https://demo.prestashop.com/), written with
[Playwright](https://playwright.dev/) and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (LTS recommended)
- Git (to clone the repository)

## Installation

```bash
git clone <https://github.com/aleksandarstole98-sys/prestashop-register-tests.git>
cd prestashop-register-tests
npm install
npx playwright install chromium
```

## Running the tests

| What | Command |
| --- | --- |
| Run all tests (headless) | `npm test` |
| Run with a visible browser | `npm run test:headed` |
| Open Playwright UI mode (step through tests) | `npm run test:ui` |
| Run one file | `npx playwright test tests/register.positive.spec.ts` |
| Run one test by name | `npx playwright test -g "duplicate"` |
| Open the last HTML report | `npm run report` |

Screenshots, video and a trace are saved for failed tests and attached to the
HTML report.

### Using a fixed store address (optional)

`demo.prestashop.com` loads a freshly created store inside an iframe. The tests
read the store address from that iframe automatically. To skip this step, set
`STORE_URL`:

```powershell
# Windows PowerShell
$env:STORE_URL="https://<your-demo-store-address>/"; npm test
```

```bash
# macOS / Linux
STORE_URL="https://<your-demo-store-address>/" npm test
```

## Project structure

```
prestashop-register-tests/
- .github/workflows/playwright.yml   CI: runs the tests on every push
- fixtures/test.ts                   Custom fixtures that provide the page objects
- pages/
  - StorePage.ts                     Opening the store, header, sign in / sign out
  - RegistrationPage.ts              Registration form selectors and actions
- tests/
  - register.positive.spec.ts        Successful registration scenarios
  - register.negative.spec.ts        Validation and error scenarios
- utils/testData.ts                  Unique test customers and invalid values
- playwright.config.ts               Timeouts, reporting, browser
```

**Design decisions**

- **Page Object Model** - selectors and page actions live in `pages/`. Tests only
  describe behaviour, so a UI change is fixed in one place.
- **Unique data per test** - every customer gets a new email address, so tests are
  independent and can run in any order or be repeated.
- **Direct store URL instead of iframe** - the demo wraps the store in an iframe.
  The tests open the store address directly, which keeps every locator simple.
- **Stable locators** - form fields are located by their `name` attribute, which
  is part of the form contract and changes less often than CSS classes or text.
- **Outcome-based assertions** - positive tests check that the customer is logged
  in and their name is in the header. Negative tests check that the user is told
  what is wrong, stays on the form and is not logged in.

## Test strategy

The goal is to cover the behaviour that matters most to the business and the
user, not to maximise the number of tests.

| # | Scenario | Why it matters |
| --- | --- | --- |
| 1 | Register with required fields only | Core happy path, the minimum a customer must do |
| 2 | Register with all optional fields | Optional fields (title, birthday, offers, newsletter) must not break registration |
| 3 | Email already registered | Prevents duplicate accounts; a common real-world case |
| 4 | Invalid email format | Bad email means the customer can never sign in or get order emails |
| 5 | First name with digits | Server-side input validation |
| 6 | Password too short | Basic account security rule |
| 7 | Privacy consent not accepted | Legal (GDPR) requirement - registration must not happen without it |
| 8 | Empty form submitted | Required field validation |

**Validation approach:** PrestaShop validates some fields in the browser (HTML5
rules) and others on the server. For negative tests the requirement is "the user
is told what is wrong and no account is created", so the tests accept either
type of validation message, and always check that no one got logged in.

### Out of scope

- Cross-browser runs (only Chromium is configured; Firefox and WebKit can be added
  as extra projects in `playwright.config.ts`)
- Email confirmation and newsletter delivery (no access to a mailbox)
- Exact wording of every error message, except the duplicate email message
- Accessibility, visual and performance testing
- Back-office verification that the customer record was created

## Known limitations

- The public demo is a shared environment that resets regularly and can be slow,
  so timeouts are higher than default and tests run one at a time.
- Selectors are based on the PrestaShop **Classic** theme. If the demo switches to
  another theme, `pages/RegistrationPage.ts` and `pages/StorePage.ts` need updating.
