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
       * 1. Waits for the stats to reset which signifies that the test page has loaded (if we're not in studio single test mode)
       * 2. Waits for 'Your tests are loading...' to not be present so that we know the tests themselves have loaded
       * 3. Waits for the Rerun all tests button to be present. This ensures all tests have completed
       *
       * @param expectedResults - The expected results of the spec
       * @param timeout - The timeout for the spec to finish
       * @param isStudioMode - Whether we're in studio single test mode
       */
      waitForSpecToFinish({ expectedResults, timeout, isStudioMode }?: { expectedResults?: ExpectedResults, timeout?: number, isStudioMode?: boolean }): void
      verifyE2ESelected(): void
      verifyCtSelected(): void
    }
  }
}

export const waitForSpecToFinish = (options: {
  expectedResults?: ExpectedResults
  timeout?: number
  isStudioMode?: boolean
} = {}) => {
  const { expectedResults, timeout = 30000, isStudioMode = false } = options

  // when we're in studio single test mode, we don't have the stats so we can skip this
  if (!isStudioMode) {
    cy.get('.passed > .num').should('exist')
    cy.get('.failed > .num').should('exist')
  }

  // Then ensure the tests are not running
  cy.contains('Your tests are loading...', { timeout }).should('not.exist')

  // Then ensure the tests have finished
  cy.get('[aria-label="Rerun all tests"]', { timeout })

  if (expectedResults) {
    shouldHaveTestResults(expectedResults)
  }
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
