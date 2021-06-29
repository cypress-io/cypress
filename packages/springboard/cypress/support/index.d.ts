/// <reference types="cypress" />

declare namespace Cypress {
  export interface Chainable {
    visitIndex: (options?: Partial<Cypress.VisitOptions>) => Chainable
  }
}