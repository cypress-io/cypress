declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to take a percy snapshot of the current DOM
     * @example cy.percySnapshot()
    */
    percySnapshot (): Chainable
  }
}
