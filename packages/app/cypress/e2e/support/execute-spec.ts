import { shouldHaveTestResults } from '../runner/support/spec-loader'

export interface ExpectedResults {
  passCount?: number | string
  failCount?: number | string
  pendingCount?: number | string
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Adapter to wait for a spec to finish in a standard way. It
       *
       * 1. Waits for 'Your tests are loading...' to not be present so that we know the tests themselves have loaded
       * 2. Waits for the restart button to be present (Rerun all tests / Run test). This ensures all tests have completed.
       *    In Studio single-test mode the label is "Run test"; otherwise it is "Rerun all tests".
       *
       * @param expectedResults - The expected results of the spec
       * @param timeout - The timeout for the spec to finish
       */
      waitForSpecToFinish(expectedResults?: ExpectedResults, timeout?: number): void
      verifyE2ESelected(): void
      verifyCtSelected(): void
    }
  }
}

export const waitForSpecToFinish = (expectedResults?: ExpectedResults, timeout?: number) => {
  // Then ensure the tests are not running
  cy.contains('Your tests are loading...', { timeout: timeout || 30000 }).should('not.exist')

  // Then ensure the tests have finished (button shows "Rerun all tests" or "Run test" in Studio single-test mode)
  cy.get('button.restart', { timeout: timeout || 30000 })

  if (expectedResults) {
    shouldHaveTestResults(expectedResults)
  }
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
