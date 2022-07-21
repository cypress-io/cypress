import { mount } from './angular-mount'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}


Cypress.Commands.add('mount', mount);
