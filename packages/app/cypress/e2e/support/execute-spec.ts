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
       * 2. Waits for the Rerun all tests button to be present. This ensures all tests have completed
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

  // Then ensure the tests have finished
  cy.get('[aria-label="Rerun all tests"]', { timeout: timeout || 30000 })

  if (expectedResults) {
    shouldHaveTestResults(expectedResults)
  }
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
