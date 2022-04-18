/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      console(method: 'log' | 'error' | 'info'): Chainable<Element>;
    }
  }
}

export {}