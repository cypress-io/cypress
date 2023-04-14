/// <reference types="cypress" />

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
      waitForSpecToFinish()
    }
  }
}

// Here we export the function with no intention to import it
// This only tells the typescript type checker that this definitely is a module
// This way, we are allowed to use the global namespace declaration
export const waitForSpecToFinish = () => {
  // First ensure the test is loaded
  cy.get('.passed > .num').should('contain', '--')
  cy.get('.failed > .num').should('contain', '--')

  // Then ensure the tests are running
  cy.contains('Your tests are loading...').should('not.exist')

  // Then ensure the tests have finished
  cy.get('[aria-label="Rerun all tests"]', { timeout: 30000 })
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
