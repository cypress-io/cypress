/// <reference types="cypress" />
import { mount } from 'cypress/angular'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(MyComponent)
