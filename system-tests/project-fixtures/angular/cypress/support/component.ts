import { mount, inject } from 'cypress/angular'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
      inject: typeof inject
    }
  }
}

Cypress.Commands.add('mount', mount)
Cypress.Commands.add('inject', inject)
