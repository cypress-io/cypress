/// <reference types="cypress" />
import type { ExpectedResults } from '@packages/app/cypress/e2e/support/execute-spec'
import { waitForSpecToFinish } from '@packages/app/cypress/e2e/support/execute-spec'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Adapter to wait for a spec to finish in a standard way. It
       *
       * 1. Waits for the stats to reset which signifies that the test page has loaded
       * 2. Waits for 'Your tests are loading...' to not be present so that we know the tests themselves have loaded
       * 3. Waits (with a timeout of 30s) for the Rerun all tests button to be present. This ensures all tests have completed
       *
       */
      waitForSpecToFinish(expectedResults?: ExpectedResults, timeout?: number): void
    }
  }
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
