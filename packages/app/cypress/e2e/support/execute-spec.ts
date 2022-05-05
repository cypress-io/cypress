declare global {
  namespace Cypress {
    interface Chainable {
      waitForSpecToFinish()
    }
  }
}

export const waitForSpecToFinish = () => {
  // First ensure the test is loaded
  cy.get('.passed > .num').should('contain', '--')
  cy.get('.failed > .num').should('contain', '--')

  // Then ensure the tests are running
  cy.contains('Your tests are loading...').should('not.exist')

  // Then ensure the tests have finished
  cy.get('button').get('[aria-label="Rerun all tests"]').should('exist')
}

Cypress.Commands.add('waitForSpecToFinish', waitForSpecToFinish)
