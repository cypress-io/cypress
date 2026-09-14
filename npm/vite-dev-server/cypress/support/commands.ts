/// <reference types="cypress" />
import type { ExpectedResults } from '@packages/app/cypress/e2e/support/execute-spec'
import { waitForSpecToFinish } from '@packages/app/cypress/e2e/support/execute-spec'
import '@packages/app/cypress/e2e/support/reporter'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Adapter to wait for a spec to finish in a standard way. It
       *
       * 1. Waits for 'Your tests are loading...' to not be present so that we know the tests themselves have loaded
       * 2. Waits (with a timeout of 30s) for the restart button to be present (Rerun all tests / Run test in Studio single-test mode). This ensures all tests have completed.
       *
       */
      waitForSpecToFinish(expectedResults?: ExpectedResults, timeout?: number): void
    }
  }
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
